(function() {    
//constructor for orders class
function newOrder() {
    this.size = '';
    this.flavor = [];
    this.toppings = [];
    this.price = 0;
    this.sizePrice = 0;
    this.toppingPrice = 0;
    this.orderNum;
}

//setting up the AngularJS module for the features of the froyo order, includes dependencies to include the ngAnimate and UI Bootstrap libraries
var app = angular.module('app', ['ngAnimate','ui.bootstrap']);

//controller for the navigational tabs
app.controller('PanelController', function () {
    this.tab = 1;
    
    //opens tab equal to setTab parameter
    this.selectTab = function(setTab) {
        this.tab = setTab;
    };
    
    //opens previous tab
    this.previousTab = function() {
        this.tab--;
    };
    
    //opens next tab
    this.nextTab = function() {
        this.tab++;
    };
    
    //checks to see if the tab equal to checkTab parameter is currently active
    this.isSelected = function(checkTab) {
        return this.tab === checkTab;
    };
    
    //automatically shows the "Thank you for your purchase" modal after the card and cash modals are closed
    $('.bs-card-modal-lg').on('hide.bs.modal', function () {
        $('.bs-done-modal-lg').modal('show');
    });
    $('.bs-cash-modal-lg').on('hide.bs.modal', function () {
        $('.bs-done-modal-lg').modal('show');
    });
    //automatically reloads the page to get back to the size panel after the "Thank you for your purchase" modal is closed
    $('.bs-done-modal-lg').on('hide.bs.modal', function () {
        location.reload();
    });
});

//custom AngularJS element directive that links the header navigation button for "Start over"
app.directive('headerNavigation', function() {
    return {
        restrict: 'E',
        templateUrl: 'header-navigation.html'
    };
});
    
//custom AngularJS element directive that links the foot navigation buttons for "Go Back" and "Confirm"    
app.directive('footerNavigation', function() {
    return {
        restrict: 'E',
        templateUrl: 'footer-navigation.html'
    }
});
    
//custom AngularJS element directive that links the "Your order so far..." widget
app.directive('orderSummary', function() {
   return {
       restrict: 'E',
       templateUrl: 'order-widget.html'
   };
});
    
//custom AngularJS element directive that links the summary table for all orders on the "Your Order(s)" page
app.directive('orderTable', function() {
    return {
        restrict: 'E',
        templateUrl: 'order-table.html'
    }
});
    
//main AngularJS controller for the order 
app.controller('MainController', function($scope){
    this.allOrders = [];
    this.currentOrder = new newOrder();
    this.totalPrice = 0;
    this.currentOrder.orderNum = this.allOrders.length + 1;
    this.alert = false;
    
    //clears the current order that is currently being modified for a given transaction
    this.clearCurrentOrder = function() {
        this.currentOrder = new newOrder();
        this.currentOrder.orderNum = this.allOrders.length + 1;
        this.flavorCounter = 0;
        this.unselectAllOtherButtons(this.sizes, -1);
        this.unselectAllOtherButtons(this.flavors, -1);
        this.unselectAllOtherButtons(this.toppings, -1);
        $('.confirm').prop('disabled', true);
    };
    //clears all orders and the current order for a given transaction
    this.clearAllOrders = function() {
        this.allOrders = [];
        this.clearCurrentOrder();
    };
    //adds the current order into the array that contains all orders for this transaction
    this.addOrder = function(orderToAdd, orderNumber) {
        this.flavorCounter = 0;
        this.allOrders[orderNumber-1] = orderToAdd;
        this.currentOrder = new newOrder();
        this.updateOrderPrice();
        $('.confirm').prop('disabled', true);
    };
    //removes the order at index from the history of transactions
    this.removeOrder = function(index) {
        this.allOrders.splice(index, 1);
        for (var i = index; i < this.allOrders.length; i++) {
            //makes sure to decrement the orderNum to fill in the gap of the spliced array item
            this.allOrders[i].orderNum--;
        }
        this.updateOrderPrice();
    }
    //function to retrieve an order from the array of all orders and set as the current order for modification
    this.modifyOrder = function(orderNumber) {
        this.currentOrder = this.allOrders[orderNumber];
        this.flavorCounter = this.currentOrder.flavor.length;
        this.unselectAllOtherButtons(this.sizes, -1);
        this.unselectAllOtherButtons(this.flavors, -1);
        this.unselectAllOtherButtons(this.toppings, -1);
        
        $('.confirm').prop('disabled', false);
        this.reselectOptions(this.sizes, this.currentOrder.size);
        this.reselectFlavors();
        this.reselectToppings();
    };
    //function to reselect the button for property of a given order that is being modified
    this.reselectOptions = function(array, searchKey) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].name === searchKey) {
                array[i].toggle = true;
                document.getElementById(array[i].id).checked = true;
            }
        }
    };
    //function to reselect the toppings buttons for a given order that is being modified
    this.reselectFlavors = function() {
        for (var i = 0; i < this.currentOrder.flavor.length; i++) {
            for (var x = 0; x < this.flavors.length; x++) {
                if (this.currentOrder.flavor[i] === this.flavors[x].name) {
                    this.flavors[x].toggle = true;
                    document.getElementById(this.flavors[x].id).checked = true;
                }
            }
        }
    };
    //function to reselect the toppings buttons for a given order that is being modified
    this.reselectToppings = function() {
        this.choices = this.currentOrder.toppings;
        for (var i = 0; i < this.currentOrder.toppings.length; i++) {
            for (var x = 0; x < this.toppings.length; x++) {
                if (this.currentOrder.toppings[i] === this.toppings[x].name) {
                    this.toppings[x].toggle = true;
                    document.getElementById(this.toppings[x].id).checked = true;
                }
            }
        }
    };
    
    //function that loops through all the topping buttons (except for the "No Toppings" button), deselecting and making them inactive; entering -1 as the index will clear deselect ALL buttons
    this.unselectAllOtherButtons = function(array, index) {
        for (var i = 0; i < array.length; i++) {
            if (i !== index) {
                var id = array[i].id;
                array[i].toggle = false;
                document.getElementById(id).checked = false;
            }
        }
    };
    
    //function that updates the subtotal price of the current order and also the total price for all orders in a given transaction
    this.updateOrderPrice = function() {
        this.currentOrder.price = this.currentOrder.sizePrice + this.currentOrder.toppingPrice;
        //totals the total charge of all items in the allOrders array
        this.totalPrice = 0;
        if (this.allOrders.length > 0) {
            for (var i = 0; i < this.allOrders.length; i++) {
                this.totalPrice += this.allOrders[i].price;
            }
            if (this.currentOrder.price > 0) {
                this.totalPrice += this.currentOrder.price;
            }
        } else {
            this.totalPrice = this.currentOrder.price;
        }
    };
    
    //size tab options
    this.sizeheader = 'Choose your size';
    this.sizes = [
        {
            id: 'size1',
            name: 'Small',
            measurement: '8 oz.',
            price: 3,
            image: 'img/8oz.jpeg',
            toggle: false
        },
        {
            id: 'size2',
            name: 'Medium',
            measurement: '12 oz.',
            price: 4,
            image: 'img/12oz.jpeg',
            toggle: false
        },
        {
            id: 'size3',
            name: 'Large',
            measurement: '16 oz.',
            price: 5,
            image: 'img/16oz.jpeg',
            toggle: false
        }
    ];
    //function that enters the chosen size selection to be stored into the current order
    this.inputOrderSize = function(index) {
        var sizeChoice = this.sizes[index].name;
        var updatedPrice = this.sizes[index].price;
        this.sizes[index].toggle = true;
        this.unselectAllOtherButtons(this.sizes, index);
        this.currentOrder.size = sizeChoice;
        this.currentOrder.sizePrice = updatedPrice;
        this.updateOrderPrice();
    };
    
    //flavor tab options
    this.flavorheader = 'Choose your flavor(s)';
    this.flavorsubheader = 'Choose two to swirl it for no additional charge!';
    this.flavors = [
        {
            id: 'flavor1', 
            name: 'Original (tart)', 
            toggle: false
        }, 
        {
            id: 'flavor2', 
            name: 'Green Tea', 
            toggle: false
        }, 
        {
            id: 'flavor3', 
            name: 'Sea Salt Caramel', 
            toggle: false
        }, 
        {
            id: 'flavor4', 
            name: 'Taro', 
            toggle: false
        }, 
        {
            id: 'flavor5', 
            name: 'Mango', 
            toggle: false
        },
        {
            id: 'flavor6', 
            name: 'Chocolate', 
            toggle: false
        },
        {
            id: 'flavor7', 
            name: 'Pumpkin (seasonal)', 
            toggle: false
        },
        {
            id: 'flavor8', 
            name: 'Creme Brulee (seasonal)', 
            toggle: false
        }
    ];
    this.flavorCounter = 0;
    //function that enters the chosen flavor(s) (up to two choices if user wants a swirl) selection to be stored into the current order, then enables the confirm buttons so they can move to the next page
    this.inputOrderFlavor = function (index) {
        if ((this.flavorCounter < 2) && (!this.flavors[index].toggle)) {
            this.flavors[index].toggle = true;
            this.currentOrder.flavor.push(this.flavors[index].name);
            this.flavorCounter++;
            $('.confirm').prop('disabled', false);
        } else if ((this.flavorCounter <= 2) && (this.flavors[index].toggle)) {
            var toRemove = this.currentOrder.flavor.indexOf(this.flavors[index].name);
            this.flavors[index].toggle = false;
            this.currentOrder.flavor.splice(toRemove, 1);
            this.flavorCounter--;
            
            if (this.flavorCounter === 0) {
                $('.confirm').prop('disabled', true);
            }
        }
    };
    
    //toppings tab options
    this.toppingheader = 'Choose your topping(s)';
    this.toppings = [
        {
            id: 'topping1',
            name: 'No Toppings',
            price: 0,
            toggle: false
        },
        {
            id: 'topping2',
            name: 'Sprinkles',
            price: 0.25,
            toggle: false,
            image: 'img/toppings_sprinkles.png'
        },
        {
            id: 'topping3',
            name: 'Gummy Bears',
            price: 0.5,
            toggle: false,
            image: 'img/toppings_gummybears.png'
        },
        {
            id: 'topping4',
            name: 'Peanuts',
            price: 0.25,
            toggle: false,
            image: 'img/toppings_peanuts.png'
        },
        {
            id: 'topping5',
            name: 'Cookie Dough',
            price: 0.5,
            toggle: false,
            image: 'img/toppings_dough.png'
        },
        {
            id: 'topping6',
            name: 'M&Ms',
            price: 0.5,
            toggle: false,
            image: 'img/toppings_mms.png'
        },
        {
            id: 'topping7',
            name: 'Coconut Flakes',
            price: 0.5,
            toggle: false,
            image: 'img/toppings_coconut.png'
        },
        {
            id: 'topping8',
            name: 'Fruity Pebbles',
            price: 0.5,
            toggle: false,
            image: 'img/toppings_fruitypebbles.png'
        }
    ];
    this.choices = [];
    this.toggleBtn = function(index) {
        var id = this.toppings[index].id;
        
        //when "No Toppings" is selected, resets choices on the page and removes the price from the subtotal
        if (index === 0) {
            this.toppings[index].toggle = true;
            this.unselectAllOtherButtons(this.toppings, index);
            this.choices = [this.toppings[index].name];
            this.currentOrder.toppingPrice = 0;
            this.updateOrderPrice();
            return;
        }
        
        //if "No Toppings" button is chosen at any time, it clears all other toppings that were previously chosen
        if (this.toppings[0].toggle) {
            this.toppings[0].toggle = false;
            this.choices = [];
        }
        
        //adds and removes toppings from the current order as their associated buttons are selected and deselected, also updates the price each time
        if ((index > 0) && (!this.toppings[index].toggle)) {
            this.choices.push(this.toppings[index].name);
            this.toppings[index].toggle = true;
            this.currentOrder.toppingPrice += this.toppings[index].price;
        } else if ((index > 0) && (this.toppings[index].toggle)) {
            var arrayIndex = this.choices.indexOf(this.toppings[index].name);
            this.choices.splice(arrayIndex, 1);
            this.toppings[index].toggle = false;
            this.currentOrder.toppingPrice -= this.toppings[index].price;
        }
        this.updateOrderPrice();
    };
    //function that enters the chosen topping selections to be stored into the current order
    this.inputOrderTopping = function() {
        if (this.choices.length == 0) {
            this.choices.push(this.toppings[0].name);
        }
        this.currentOrder.toppings = this.choices;
        this.addOrder(this.currentOrder, this.currentOrder.orderNum);
        this.choices = [];
    };
    
    //cart tab options
    this.cartheader = 'Your Order(s)';
    
    //payment tab options
    this.paymentheader = 'Payment';
});
    
})();