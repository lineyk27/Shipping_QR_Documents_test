"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    //const pdfLib = require("./pdf-lib.js"); // please change on publish
    const pdfLib = require("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.js"); // prod 

    const placeHolder = function ($scope) {
        const vm = this;
        vm.templateQrs = {
            'Serbia': {
                templateType: 'Invoice',
                qrCode: { x: 100, y: 100, width: 100, height: 100 }
            }
        };

        vm.getItems = () => ([{
            key: "placeholderPrintShippingDocumentsQR",
            text: "Print QR shiping documents",
            icon: "fa func fa-print"
        }]);

        vm.isEnabled = () => true;

        vm.onClick = function(itemKey, $event){
            vm.isEnabled = () => false;

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
                            let templatQr = vm.templateQrs[orderDocuments.Country];
                            
                            let promise = pdfLib.PDFDocument.load(document.DocumentBase64)
                                .then(pdfDocument => {
                                    if (!!templatQr && templatQr.templateType === document.TemplateType) {
                                        return Promise.all([pdfDocument.embedPng(qrCode), pdfDocument]);
                                    }
                                    return [null, pdfDoc];
                                })
                                .then(([image, pdfDoc]) => {
                                    if (image) {
                                        let firstPage = pdfDocument.getPages()[0];
                                        firstPage.drawImage(img, {
                                            x: templateQr.qrCode.x,
                                            y: templateQr.qrCode.y,
                                            width: templateQr.qrCode.width,
                                            height: templateQr.qrCode.height,
                                        });
                                    }
                                    return pdfDoc;
                                })
                                .then(pdfDoc => {
                                    resultDocuments.drawImage(pdfDoc);
                                })
                                .catch(error => {
                                    handleErrors(error);
                                });
                            documentPromises.push(promise);
                        }
                    }

                    Promise.all([documentPromises, pdfLib.PDFDocument.create()])
                        .then(([_, resultDocument]) => {
                            for (let i = 0; i < resultDocuments.length; i++) {
                                let doc = resultDocuments[i];
                                for (let page = 0; page < doc.getPageCount(); page++) {
                                    resultDocument.addPage(doc.getPage(page));
                                }
                            }
                            return resultDocument.saveAsBase64();
                        })
                        .then(pdfBase64 => {
                            printService.OpenPrintDialog("data:application/pdf;base64," + pdfBase64);
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

        function handleErrors (error) {
            console.log("Printing MONA documents error");
            console.log(error);
        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});
