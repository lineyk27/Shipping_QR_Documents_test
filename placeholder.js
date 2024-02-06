"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const pdfLib = require("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.js");

    const placeHolder = function ($scope) {
        const vm = this;

        vm.getItems = () => ([{
            key: "placeholderPrintShippingDocumentsQR",
            text: "Štampanje dokumenata(TEST)",
            icon: "fa func fa-print"
        }]);

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
            const totalPages = Math.ceil(items.length / 5);
            let ordersDocuments = [];
            for(let i = 1; i < totalPages; i++)
            {
                let pageItems = paginate(items, 5, i);
                macroService.Run({applicationName: "ShippingQRDocuments_App", macroName: "Shipping_QR_Documents", orderIds: pageItems}, function (result) {
                    if (!result.error) {
                        if (result.result.PrintErrors.length > 0) {
                            result.result.PrintErrors.forEach(printError => {
                                Core.Dialogs.addNotify(printError, 'ERROR');
                            });
                            return;
                        };
                        ordersDocuments = ordersDocuments.concat(ordersDocuments, result.result.OrderDocuments);
                        if (ordersDocuments.length == items.length) {
                            printFiles(ordersDocuments);
                        }
                    }
                });
            }

            vm.isEnabled = () => true;
        };

        function printFiles(ordersDocuments, ){
            let documentPromises = [];
            let resultDocuments = [];
            let docIndex = 0;
            for (let i = 0; i < ordersDocuments.length; i++) {
                let orderDocuments = ordersDocuments[i];

                for (let j = 0; j < orderDocuments.Documents.length; j++) {
                    let document = orderDocuments.Documents[j];
                    let qrTemplate = vm.templateQrs[document.DocumentName];
                    let order = docIndex;
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
                            resultDocuments.push({ index: order, pdfDocument});
                        })
                        .catch(error => {
                            handleErrors(error);
                        });
                    documentPromises.push(promise);
                    ++docIndex;
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
                    const blob = b64toBlob(docBase64, 'application/pdf');
                    const blobURL = URL.createObjectURL(blob);
                    console.log(blobURL);
                    printService.OpenPrintDialog(blobURL);
                })
                .catch(error => {
                    handleErrors(error);
                });
        }

        function paginate(array, page_size, page_number) {
            // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
            return array.slice((page_number - 1) * page_size, page_number * page_size);
        }

        function b64toBlob(content, contentType) {
            contentType = contentType || '';
            const sliceSize = 512;
            const byteCharacters = window.atob(content);
        
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                const slice = byteCharacters.slice(offset, offset + sliceSize);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, {
                type: contentType
            });
            return blob;
        }

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
