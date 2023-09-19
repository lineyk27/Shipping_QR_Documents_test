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
                vm.button = document.querySelectorAll("button[key='placeholderSetDeliveryDate']")[0];
                vm.picker = new datepicker.create({
                    element: vm.button,
                    css: [ 'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css',],
                    autoApply: false,
                    locale: {
                        apply: "Save"
                    },
                    setup(picker){
                        picker.on('select', (e) => {
                            const { date } = e.detail;
                            vm.onApproveSelectDate(date);
                            vm.button.innerText = vm.buttonName;
                        });
                    },
                    zIndex: 100
                });
            }
            vm.setPopoverOpen(true);
        };

        vm.onApproveSelectDate = function(date){
            vm.selectedOrders = $scope.viewStats.selected_orders.map(i => i.id);
            vm.ordersService.getOrders(vm.selectedOrders, null, true, true, function(response){
                let orders = response.result;
                for(let order of orders){
                    vm.ordersService.setOrderGeneralInfo(order.OrderId, {
                        ReceivedDate: order.GeneralInfo.ReceivedDate,
                        Source: order.GeneralInfo.Source,
                        SubSource: order.GeneralInfo.SubSource,
                        Marker: order.GeneralInfo.Marker,
                        Status: order.GeneralInfo.Status,
                        HasScheduledDelivery: true,
                        DespatchByDate: order.GeneralInfo.DespatchByDate,
                        ScheduledDelivery: {
                            From: date.format("YYYY-MM-DDTHH:mm:ss.sssZ"),
                            To: date.format("YYYY-MM-DDTHH:mm:ss.sssZ")
                        },
                    }, false, () => vm.onUpdateGeneralInfo(order.OrderId));// todo: check is draft
                };
            });
        };

        vm.setPopoverOpen = function(isOpen){
            if (isOpen) {
                vm.picker.show()
            } else {
                vm.picker.hide();
            }
        };

        vm.onUpdateGeneralInfo = function (orderId){
            vm.selectedOrders.splice(vm.selectedOrders.indexOf(orderId), 1);
            if(!vm.selectedOrders.length){
                vm.setPopoverOpen(false);
            }
        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});