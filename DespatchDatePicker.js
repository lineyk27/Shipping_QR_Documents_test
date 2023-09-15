'use strict';

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const datepicker = require("https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.umd.min.js");
    
    const placeHolder = function ($scope, $element, $http) {
        const vm = this;
        vm.buttonName = "Set delivery date";
        vm.ordersService = new Services.OrdersService(vm);
        vm.selectedOrders = [];
        vm.picker = null;

        vm.getItems = () => ([{
            key: "placeholderSetDeliveryDate",
            text: this.buttonName,
            icon: "fa func fa-truck"
        }]);

        let watchFunc = $scope.$watch($scope.viewStats.get_selected_orders, function(newVal, oldVal){
            console.log(newVal);
            if(newVal && newVal.length){
                $scope.isEnabled = () => true;
            } else {
                $scope.isEnabled = () => false;
            }
        }, true);

        vm.isEnabled = (itemKey) => true;

        vm.onClick = function(itemKey, $event){
            if(!vm.picker){
                vm.picker = new datepicker.create({
                    element: document.querySelectorAll("button[key='placeholderSetDeliveryDate']")[0],
                    css: [ 'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css',],
                    autoApply: false,
                    locale: {
                        apply: "Save"
                    },
                    setup(picker){
                        picker.on('select', (e) => {
                            // const { view, date, target } = e.detail;
                            vm.onApproveSelectDate();
                            button.innerHTML = vm.buttonName;
                        });
                    },
                    zIndex: 100
                });
            }
            vm.setPopoverOpen(true);
        };

        vm.onApproveSelectDate = function(){
            let date = "";// format - 2023-09-16T12:47:07.05Z
            vm.selectedOrders = $scope.viewStats.selected_orders.map(i => i.id);
            console.log(items);
            console.log(date);
            vm.ordersService.getOrders(vm.selectedOrders, null, true, true, function(response){
                let orders = response.result;
                for(let order of orders){
                    console.log("seting order general info");
                    console.log(order);
                    vm.ordersService.setOrderGeneralInfo(order.OrderId, {
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
                    }, false, () => vm.onUpdateGeneralInfo(order.OrderId));// todo: check is draft
                };
            });
        };

        vm.setPopoverOpen = function(isOpen){
            if(isOpen){
                vm.picker.show()
            }else{
                vm.picker.hide();
            }
        };

        vm.onUpdateGeneralInfo = function (orderId){
            selectedOrders.splice(selectedOrders.indexOf(orderId), 1);
            if(!selectedOrders.length){
                $scope.setPopoverOpen(false);
            }
        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});