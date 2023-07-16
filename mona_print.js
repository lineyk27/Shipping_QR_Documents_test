'use strict';

// get selected orders ids

define(function(require) {
    const pdfLib = require("./pdf-lib.js"); // please change on publish

    const placeHolder = function ($scope, $element, $http) {
        this.templatQrs = {
            'Serbia': [
                {
                    templateType: 'Invoice',
                    qrCode: { x: 100, y: 100, width: 100, height: 100 }
                }
            ],
            'Croatia': [
            ]
        };

        this.items = {

        };

        function handleErrors (error) {
            console.log("Printing MONA documents error");
            console.log(error);
        }

        $scope.onClick = function(itemKey, $event){
            var items = $scope.viewStats.get_selected_orders();
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
                        let qrCode = orderDocuments.QRCodebase64;
                        let docs = orderDocuments.Documents;

                        for (let i = 0; i < docs.length; i++) {
                            let document = docs[i];
                            let templatQr = templatQrs[orderDocuments.Country];
                            
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
                        .then((resultDocument) => {
                            for (let i = 0; i < resultDocuments.length; i++) {
                                let doc = resultDocuments[i];
                                for (let page = 0; page < doc.getPageCount(); page++) {
                                    resultDocument.addPage(doc.getPage(page));
                                }
                            }
                            return resultDocument.saveAsBase64();
                        })
                        .then(base64 => {
                            let pdfBinary = convertBase64ToBinary(base64);
                            new Services.PrintService().OpenPrintDialog(pdfBinary);
                        })
                        .catch(error => {
                            handleErrors(error);
                        });
                } else {
                    handleErrors(result.error);
                };
            })
            
        };

        function convertBase64ToBinary(data) {
            var raw = window.atob(data);
            var rawLength = raw.length;
            var array = new Uint8Array(new ArrayBuffer(rawLength));
          
            for(var i = 0; i < rawLength; i++) {
              array[i] = raw.charCodeAt(i);
            }
            return array;
          }

    };

});


// public class OrderDocuments
// {
//     public class OrderDocument
//     {
//         public string DocumentType { get; set; }
//         public string DocumentBase64 { get; set; }
//     }
//     public Guid OrderId { get; set; }
//     public string Country { get; set; }
//     public string QRCodeBase64 { get; set; }
//     public List<OrderDocument> Documents { get; set; } = new List<OrderDocument>();
// }

// const ordersService = new Services.OrdersService(vm);

//             ordersService.getOrders(items, null, false, false, function (data) {
//                 if (!data.error) {
//                     let orders = data.result;
//                     orders = orders.filter(item => {
//                         let identifiers = item.GeneralInfo.Identifiers;
//                         if (identifiers && identifiers.length) {
//                             return identifiers.filter(i => i.Name == "Mona").length;
//                         }
//                         return false;
//                     });
                    
//                     if (!orders.length) {
//                         alert("Selected orders do not have 'Mona' identifier.")
//                         return;
//                     }

//                     const printService = new Services.PrintService(vm);

//                     printService.GetTemplateList("Invoice Template", function (data) {
//                         if (!data.error) {
//                             let templates = data.result;

//                             for (let i = 0; i < orders.length; i++) {
//                                 let order = orders[i];

//                                 let orderDocuments = vm.templates[order.CustomerInfo.Address.Country];
//                                 if (!orderDocuments) {
//                                     continue;
//                                 };
//                             }
                            
//                             //foreach order in orders 
//                             //generate defined templates
//                             //for invoices add qr codes from extended properties
//                             //add generated shipping labels

//                             //error message way Core.Dialogs.error({message: "asdasd"});


//                         } else {

//                         }
//                     });




//                 } else {
//                     // handle error message
//                     alert(data.error.errorMessage);
//                     return;
//                 }
//             });


