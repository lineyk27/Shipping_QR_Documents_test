"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const pdfLib = require("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.js");

    const placeHolder = function ($scope) {
        const vm = this;

        vm.getItems = () => ([{
            key: "placeholderPrintShippingDocumentsQR",
            text: "Print Shipping Documents",
            icon: "fa func fa-print"
        }]);

        vm.isLoading = true;

        vm.isEnabled = () => true;

        vm.onClick = function(itemKey, $event){
            vm.isEnabled = () => false;

            vm.templateQrs = {
                'Serbia': {
                    templateType: 'Invoice',
                    qrCode: { x: 456, y: 447, width: 180, height: 151 }
                }
            };

            let items = $scope.viewStats.selected_orders.map(i => i.id);
            if (!items || !items.length) {
                return;
            };

            const macroService = new Services.MacroService();
            const printService = new Services.PrintService();

            macroService.Run({applicationName: "Test_print_qr_code", macroName: "Test_print_qr_code", orderIds: items}, function (result) { // change before publish
                if (!result.error) {
                    const ordersDocuments = result.result;

                    let documentPromises = [];
                    let resultDocuments = [];
                    for (let i = 0; i < ordersDocuments.length; i++) {
                        let orderDocuments = ordersDocuments[i];
                        let qrCode = orderDocuments.QRCodeBase64;
                        let docs = orderDocuments.Documents;

                        for (let i = 0; i < docs.length; i++) {
                            let document = docs[i];
                            let templateQr = vm.templateQrs[orderDocuments.Country];
                            
                            let promise = pdfLib.PDFDocument.load(document.DocumentBase64)
                                .then(pdfDocument => {
                                    if (!!templateQr && templateQr.templateType === document.DocumentType && qrCode) {
                                        return Promise.all([pdfDocument.embedPng(qrCode), pdfDocument]);
                                    }
                                    return Promise.all([null, pdfDocument]);
                                })
                                .then(([image, pdfDocument]) => {
                                    if (image) {
                                        let firstPage = pdfDocument.getPages()[0];
                                        firstPage.drawImage(image, {
                                            x: templateQr.qrCode.x,
                                            y: templateQr.qrCode.y,
                                            width: templateQr.qrCode.width,
                                            height: templateQr.qrCode.height,
                                        });
                                    }
                                    return pdfDocument;
                                })
                                .then(pdfDocument => {
                                    resultDocuments.push(pdfDocument);
                                })
                                .catch(error => {
                                    handleErrors(error);
                                });
                            documentPromises.push(promise);
                        }
                    }

                    Promise.all(documentPromises)
                        .then(() => pdfLib.PDFDocument.create())
                        .then((resultDocument) => {
                            let copyPromises = [];
                            for (let i = 0; i < resultDocuments.length; i++) {
                                let promise = resultDocument.copyPages(resultDocuments[i], getDocumentIndices(resultDocuments[i]));
                                copyPromises.push(promise);
                            }
                            return Promise.all([Promise.all(copyPromises), resultDocument]);
                        })
                        .then(([docPages, resultDocument]) => {
                            docPages.forEach(pages => pages.forEach(page => resultDocument.addPage(page)));
                            return resultDocument.saveAsBase64();
                        })
                        .then(docBase64 => {
                            printService.OpenPrintDialog("data:application/pdf;base64," + docBase64);
                        })
                        .catch(error => {
                            handleErrors(error);
                        });
                } else {
                    handleErrors(result.error);
                };
            });
            vm.isEnabled = () => true;
        };

        function getDocumentIndices(pdfDoc){
            let arr = [];
            for(let i = 0; i < pdfDoc.getPageCount(); i++){
                arr.push(i);
            }
            return arr;
        }

        function handleErrors (error) {
            console.log("Printing shipping QR documents error: ");
            console.log(error);
        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});
