"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const pdfLib = require("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.js");

    const placeHolder = function ($scope) {
        const vm = this;

        vm.getItems = () => ([{
            key: "placeholderPrintShippingDocumentsQR",
            text: "Print Shipping Documents(test)",
            icon: "fa func fa-print"
        }]);

        vm.isLoading = true;

        vm.isEnabled = (itemKey) => true;

        vm.onClick = function(itemKey, $event){
            vm.isEnabled = () => false;

            vm.templateQrs = {
                "Racun - RS": { x: 417, y: 420, width: 135, height: 112 },
                "Racun - HR": { x: 417, y: 420, width: 135, height: 112 },
                "Racun - BA": { x: 417, y: 420, width: 135, height: 112 },
                "Racun - MK": { x: 417, y: 420, width: 135, height: 112 },
                "Racun - ME": { x: 417, y: 420, width: 135, height: 112 }
            };

            let items = $scope.viewStats.selected_orders.map(i => i.id);
            
            if (!items || !items.length) {
                return;
            };

            const macroService = new Services.MacroService();
            const printService = new Services.PrintService();

            macroService.Run({applicationName: "ShippingQRDocuments_App", macroName: "Shipping_QR_Documents", orderIds: items}, function (result) {
                if (!result.error) {
                    const ordersDocuments = result.result;

                    let documentPromises = [];
                    let resultDocuments = [];
                    let docIndex = 0;
                    for (let i = 0; i < ordersDocuments.length; i++) {
                        let orderDocuments = ordersDocuments[i];

                        for (let j = 0; j < orderDocuments.Documents.length; j++) {
                            let document = orderDocuments.Documents[i];
                            let qrTemplate = vm.templateQrs[document.DocumentName];
                            
                            let promise = pdfLib.PDFDocument.load(document.DocumentBase64)
                                .then(pdfDocument => {
                                    if (!!qrTemplate && orderDocuments.QRCodeBase64) {
                                        return Promise.all([pdfDocument.embedPng(orderDocuments.QRCodeBase64), pdfDocument]);
                                    }
                                    return Promise.all([null, pdfDocument]);
                                })
                                .then(([image, pdfDocument]) => {
                                    if (image) {
                                        let firstPage = pdfDocument.getPages()[0];
                                        firstPage.drawImage(image, {
                                            x: qrTemplate.x,
                                            y: qrTemplate.y,
                                            width: qrTemplate.width,
                                            height: qrTemplate.height,
                                        });
                                    }
                                    return pdfDocument;
                                })
                                .then(pdfDocument => {
                                    resultDocuments.push({ index: docIndex, pdfDocument});
                                })
                                .catch(error => {
                                    handleErrors(error);
                                });
                            documentPromises.push(promise);
                            docIndex++;
                        }
                    }

                    Promise.all(documentPromises)
                        .then(() => pdfLib.PDFDocument.create())
                        .then((resultDocument) => {
                            let copyPromises = [];
                            resultDocuments.sort((left, right) => left.index - right.index);
                            for (let i = 0; i < resultDocuments.length; i++) {
                                let promise = resultDocument.copyPages(resultDocuments[i].pdfDocument, getDocumentIndices(resultDocuments[i].pdfDocument));
                                copyPromises.push(promise);
                            };
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
