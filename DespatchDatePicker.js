'use strict';

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const datepicker = require("https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.umd.min.js");
    
    const placeHolder = function ($scope, $element, $http) {
        const vm = this;
        vm.buttonName = "Set delivery date.";
        vm.ordersService = new Services.OrdersService(vm);
        vm.selectedOrders = [];
        vm.picker = null;

        vm.button = document.querySelector("button[key='placeholderSetDeliveryDate']");

        vm.getItems = () => ([{
            key: "placeholderSetDeliveryDate",
            text: "Set delivery dates",
            icon: "fa func fa-print"
        }]);

        let watchFunc = $scope.$watch($scope.viewStats.get_selected_orders, function(newVal, oldVal){
            if(newVal && newVal.length){
                $scope.isEnabled = () => true;
            } else {
                $scope.isEnabled = () => false;
            }
        }, true);

        vm.isEnabled = (itemKey) => false;

        vm.onClick = function(itemKey, $event){
            selectedOrders = items;
            if(!vm.picker){
                vm.picker = new datepicker.create({
                    element: vm.button,
                    css: [ 'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css',],
                    autoApply: false,
                    locale: {
                        apply: "Save"
                    },
                    setup(picker){
                        picker.on('select', (e) => {
                            // const { view, date, target } = e.detail;
                            $scope.onApproveSelectDate();
                            button.innerHTML = vm.buttonName;
                        });
                    }
                });
            }
            setPopoverOpen(true);

        };

        vm.onApproveSelectDate = function(){
            let date = "";// format - 2023-09-16T12:47:07.05Z
            let items = $scope.viewStats.get_selected_orders();
            ordersService.getOrders(items, null, true, true, function(response){
                let orders = response.result;
                for(let order of orders){
                    ordersService.setOrderGeneralInfo(order.OrderId, {
                        ReceivedDate: order.GeneralInfo.ReceivedDate,
                        Source: order.GeneralInfo.Source,
                        SubSource: order.GeneralInfo.SubSource,
                        Marker: order.GeneralInfo.Marker,
                        Status: order.GeneralInfo.Status,
                        HasScheduledDelivery: true,
                        DespatchByDate: order.GeneralInfo.DespatchByDate,
                        ScheduledDelivery: {
                            From: date,
                            To: date
                        },
                    }, false, () => $scope.onUpdateGeneralInfo(order.OrderId));// todo: check is draft
                };
            });
        };

        $scope.setPopoverOpen = function(isOpen){
            if(isOpen){
                picker.show()
            }else{
                picker.hide();
            }
        };

        $scope.onUpdateGeneralInfo = function (orderId){
            selectedOrders.splice(selectedOrders.indexOf(orderId), 1);
            if(!selectedOrders.length){
                $scope.setPopoverOpen(false);
            }
        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});