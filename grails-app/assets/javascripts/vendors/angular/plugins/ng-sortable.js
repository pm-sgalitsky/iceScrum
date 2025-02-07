/*
 ng-sortable v1.3.8
 The MIT License (MIT)

 Copyright (c) 2014 Muhammed Ashik

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

// CUSTOMIIIIZED

/*jshint indent: 2 */
/*global angular: false */

(function() {
    'use strict';
    angular.module('as.sortable', [])
        .constant('sortableConfig', {
            itemClass: 'as-sortable-item',
            handleClass: 'as-sortable-item-handle',
            placeHolderClass: 'as-sortable-placeholder',
            dragClass: 'as-sortable-drag',
            hiddenClass: 'as-sortable-hidden',
            dragging: 'as-sortable-dragging',
            throttle: 50,
            elementsOver: [],
            elementsBounding: []
        });
}());

/*jshint indent: 2 */
/*global angular: false */

(function() {
    'use strict';

    var mainModule = angular.module('as.sortable');

    /**
     * Helper factory for sortable.
     */
    mainModule.factory('$helper', ['$document', '$window', 'sortableConfig',
        function($document, $window, sortableConfig) {
            return {
                cleanCache: function() {
                    _.forEach(sortableConfig.elementsBounding, function(elem) {
                        elem._bounding = null;
                    });
                    sortableConfig.elementsBounding = [];
                },

                cleanStyles: function(el) {
                    if (el) {
                        angular.element(el).removeClass('sortable-item-over sortable-container-over sortable-item-over-right sortable-item-over-left');
                    } else {
                        angular.element('.sortable-item-over, .sortable-container-over').removeClass('sortable-item-over sortable-container-over sortable-item-over-right sortable-item-over-left');
                    }
                },

                boundingClient: function(element) {
                    if (!element._bounding) {
                        if (sortableConfig.elementsBounding.length > 0 && element.className.indexOf("postit") >= 0 && sortableConfig.elementsBounding[0].className.indexOf("postit") >= 0) {
                            element._bounding = sortableConfig.elementsBounding[0]._bounding;
                        } else {
                            element._bounding = element.getBoundingClientRect();
                        }
                        sortableConfig.elementsBounding.push(element);
                    }
                    return element._bounding;
                },
                /**
                 * Get the height of an element.
                 *
                 * @param {Object} element Angular element.
                 * @returns {String} Height
                 */
                height: function(element) {
                    return this.boundingClient(element[0]).height;
                },

                /**
                 * Get the width of an element.
                 *
                 * @param {Object} element Angular element.
                 * @returns {String} Width
                 */
                width: function(element) {
                    return this.boundingClient(element[0]).width;
                },

                /**
                 * Get the offset values of an element.
                 *
                 * @param {Object} element Angular element.
                 * @param {Object} [scrollableContainer] Scrollable container object for calculating relative top & left (optional, defaults to Document)
                 * @param {Object} cache position.
                 * @returns {Object} Object with properties width, height, top and left
                 */
                offset: function(element, scrollableContainer, cache) {
                    var boundingClientRect = cache ? this.boundingClient(element[0]) : element[0].getBoundingClientRect();
                    if (!scrollableContainer) {
                        scrollableContainer = $document[0].documentElement;
                    }
                    return {
                        width: boundingClientRect.width || element.prop('offsetWidth'),
                        height: boundingClientRect.height || element.prop('offsetHeight'),
                        top: boundingClientRect.top + ($window.pageYOffset || scrollableContainer.scrollTop - scrollableContainer.offsetTop),
                        left: boundingClientRect.left + ($window.pageXOffset || scrollableContainer.scrollLeft - scrollableContainer.offsetLeft)
                    };
                },

                /**
                 * get the event object for touch.
                 *
                 * @param  {Object} event the touch event
                 * @return {Object} the touch event object.
                 */
                eventObj: function(event) {
                    var obj = event;
                    if (event.targetTouches !== undefined) {
                        obj = event.targetTouches.item(0);
                    } else if (event.originalEvent !== undefined && event.originalEvent.targetTouches !== undefined) {
                        obj = event.originalEvent.targetTouches.item(0);
                    }
                    return obj;
                },

                /**
                 * Checks whether the touch is valid and multiple.
                 *
                 * @param event the event object.
                 * @returns {boolean} true if touch is multiple.
                 */
                isTouchInvalid: function(event) {

                    var touchInvalid = false;
                    if (event.touches !== undefined && event.touches.length > 1) {
                        touchInvalid = true;
                    } else if (event.originalEvent !== undefined &&
                               event.originalEvent.touches !== undefined && event.originalEvent.touches.length > 1) {
                        touchInvalid = true;
                    }
                    return touchInvalid;
                },

                /**
                 * Get the start position of the target element according to the provided event properties.
                 *
                 * @param {Object} event Event
                 * @param {Object} target Target element
                 * @param {Object} [scrollableContainer] (optional) Scrollable container object
                 * @returns {Object} Object with properties offsetX, offsetY.
                 */
                positionStarted: function(event, target, scrollableContainer) {
                    var pos = {};
                    var offset = this.offset(target, scrollableContainer, false);
                    pos.offsetX = event.pageX - offset.left;
                    pos.offsetY = event.pageY - offset.top;
                    pos.startX = pos.lastX = event.pageX;
                    pos.startY = pos.lastY = event.pageY;
                    pos.nowX = pos.nowY = pos.distX = pos.distY = pos.dirAx = 0;
                    pos.dirX = pos.dirY = pos.lastDirX = pos.lastDirY = pos.distAxX = pos.distAxY = 0;
                    return pos;
                },

                /**
                 * Calculates the event position and sets the direction
                 * properties.
                 *
                 * @param pos the current position of the element.
                 * @param event the move event.
                 */
                calculatePosition: function(pos, event) {
                    // mouse position last events
                    pos.lastX = pos.nowX;
                    pos.lastY = pos.nowY;

                    // mouse position this events
                    pos.nowX = event.pageX;
                    pos.nowY = event.pageY;

                    // distance mouse moved between events
                    pos.distX = pos.nowX - pos.lastX;
                    pos.distY = pos.nowY - pos.lastY;

                    // direction mouse was moving
                    pos.lastDirX = pos.dirX;
                    pos.lastDirY = pos.dirY;

                    // direction mouse is now moving (on both axis)
                    pos.dirX = pos.distX === 0 ? 0 : pos.distX > 0 ? 1 : -1;
                    pos.dirY = pos.distY === 0 ? 0 : pos.distY > 0 ? 1 : -1;

                    // axis mouse is now moving on
                    var newAx = Math.abs(pos.distX) > Math.abs(pos.distY) ? 1 : 0;

                    // calc distance moved on this axis (and direction)
                    if (pos.dirAx !== newAx) {
                        pos.distAxX = 0;
                        pos.distAxY = 0;
                    } else {
                        pos.distAxX += Math.abs(pos.distX);
                        if (pos.dirX !== 0 && pos.dirX !== pos.lastDirX) {
                            pos.distAxX = 0;
                        }

                        pos.distAxY += Math.abs(pos.distY);
                        if (pos.dirY !== 0 && pos.dirY !== pos.lastDirY) {
                            pos.distAxY = 0;
                        }
                    }
                    pos.dirAx = newAx;
                },

                /**
                 * Move the position by applying style.
                 *
                 * @param event the event object
                 * @param element - the dom element
                 * @param pos - current position
                 * @param container - the bounding container.
                 * @param containerPositioning - absolute or relative positioning.
                 * @param {Object} [scrollableContainer] (optional) Scrollable container object
                 */
                movePosition: function(event, element, pos, container, containerPositioning, scrollableContainer) {
                    var bounds;
                    var useRelative = (containerPositioning === 'relative');

                    element.x = event.pageX - pos.offsetX;
                    element.y = event.pageY - pos.offsetY;

                    if (container) {
                        bounds = this.boundingClient(container[0]);
                        bounds = {top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height};
                        if (useRelative) {
                            // reduce positioning by bounds
                            element.x -= bounds.left;
                            element.y -= bounds.top;

                            // reset bounds
                            bounds.left = 0;
                            bounds.top = 0;
                        }

                        if (element.x < bounds.left) {
                            element.x = bounds.left;
                        } else if (element.x >= bounds.width + bounds.left - this.width(element).width) {
                            element.x = bounds.width + bounds.left - this.width(element).width;
                        }
                        if (element.y < bounds.top) {
                            element.y = bounds.top;
                        } else if (element.y >= bounds.height + bounds.top - this.width(element).height) {
                            element.y = bounds.height + bounds.top - this.width(element).height;
                        }
                    }

                    element.css({
                        'left': element.x + 'px',
                        'top': element.y + 'px'
                    });

                    this.calculatePosition(pos, event);
                },

                /**
                 * The drag item info and functions.
                 * retains the item info before and after move.
                 * holds source item and target scope.
                 *
                 * @param item - the drag item
                 * @returns {{index: *, parent: *, source: *,
                 *          sourceInfo: {index: *, itemScope: (*|.dragItem.sourceInfo.itemScope|$scope.itemScope|itemScope), sortableScope: *},
                 *         moveTo: moveTo, isSameParent: isSameParent, isOrderChanged: isOrderChanged, eventArgs: eventArgs, apply: apply}}
                 */
                dragItem: function(item) {

                    return {
                        index: item.index(),
                        parent: item.sortableScope,
                        source: item,
                        targetElement: null,
                        targetElementOffset: null,
                        sourceInfo: {
                            index: item.index(),
                            itemScope: item.itemScope,
                            sortableScope: item.sortableScope
                        },
                        canMove: function(itemPosition, targetElement, targetElementOffset) {
                            // return true if targetElement has been changed since last call
                            if (this.targetElement !== targetElement || (this.targetElement && this.targetElement[0].className === targetElement[0].className)) {
                                this.targetElement = targetElement;
                                this.targetElementOffset = targetElementOffset;
                                return true;
                            }
                            // return true if mouse is moving in the last moving direction of targetElement
                            if (itemPosition.dirX * (targetElementOffset.left - this.targetElementOffset.left) > 0 ||
                                itemPosition.dirY * (targetElementOffset.top - this.targetElementOffset.top) > 0) {
                                this.targetElementOffset = targetElementOffset;
                                return true;
                            }
                            // return false otherwise
                            return false;
                        },
                        moveTo: function(parent, index) {
                            // move the item to a new position
                            this.parent = parent;
                            // if the source item is in the same parent, the target index is after the source index and we're not cloning
                            if (this.isSameParent() && this.source.index() < index && !this.sourceInfo.sortableScope.cloning) {
                                index = index - 1;
                            }
                            this.index = index;
                        },
                        isSameParent: function() {
                            return this.parent.element === this.sourceInfo.sortableScope.element;
                        },
                        isOrderChanged: function() {
                            return this.index !== this.sourceInfo.index;
                        },
                        eventArgs: function() {
                            return {
                                source: this.sourceInfo,
                                dest: {
                                    index: this.index,
                                    sortableScope: this.parent
                                }
                            };
                        },
                        apply: function() {
                            if (!this.sourceInfo.sortableScope.cloning) {
                                // if not cloning, remove the item from the source model.
                                this.sourceInfo.sortableScope.removeItem(this.sourceInfo.index);

                                // if the dragged item is not already there, insert the item. This avoids ng-repeat dupes error
                                if (this.parent.options.allowDuplicates || this.parent.modelValue.indexOf(this.source.modelValue) < 0) {
                                    this.parent.insertItem(this.index, this.source.modelValue);
                                }
                            } else if (!this.parent.options.clone) { // prevent drop inside sortables that specify options.clone = true
                                // clone the model value as well
                                this.parent.insertItem(this.index, angular.copy(this.source.modelValue));
                            }
                        }
                    };
                },

                /**
                 * Check the drag is not allowed for the element.
                 *
                 * @param element - the element to check
                 * @returns {boolean} - true if drag is not allowed.
                 */
                noDrag: function(element) {
                    return element.attr('no-drag') !== undefined || element.attr('data-no-drag') !== undefined;
                },

                /**
                 * Helper function to find the first ancestor with a given selector
                 * @param el - angular element to start looking at
                 * @param selector - selector to find the parent
                 * @returns {Object} - Angular element of the ancestor or body if not found
                 * @private
                 */
                findAncestor: function(el, selector) {
                    el = el[0];
                    var matches = Element.matches || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector;
                    while ((el = el.parentElement) && !matches.call(el, selector)) {
                    }
                    return el ? angular.element(el) : angular.element(document.body);
                }
            };
        }
    ]);

}());

/*jshint undef: false, unused: false, indent: 2*/
/*global angular: false */

(function() {

    'use strict';
    var mainModule = angular.module('as.sortable');

    /**
     * Controller for Sortable.
     * @param $scope - the sortable scope.
     */
    mainModule.controller('as.sortable.sortableController', ['$scope', function($scope) {

        this.scope = $scope;

        $scope.modelValue = null; // sortable list.
        $scope.callbacks = null;
        $scope.type = 'sortable';
        $scope.options = {
            longTouch: false,
            scrollableContainerSelector: null
        };
        $scope.isDisabled = false;

        /**
         * Inserts the item in to the sortable list.
         *
         * @param index - the item index.
         * @param itemData - the item model data.
         */
        $scope.insertItem = function(index, itemData) {
            if ($scope.options.allowDuplicates) {
                $scope.modelValue.splice(index, 0, angular.copy(itemData));
            } else {
                $scope.modelValue.splice(index, 0, itemData);
            }
        };

        /**
         * Removes the item from the sortable list.
         *
         * @param index - index to be removed.
         * @returns {*} - removed item.
         */
        $scope.removeItem = function(index) {
            var removedItem = null;
            if (index > -1) {
                removedItem = $scope.modelValue.splice(index, 1)[0];
            }
            return removedItem;
        };

        /**
         * Checks whether the sortable list is empty.
         *
         * @returns {null|*|$scope.modelValue|boolean}
         */
        $scope.isEmpty = function() {
            return ($scope.modelValue && $scope.modelValue.length === 0);
        };

        /**
         * Wrapper for the accept callback delegates to callback.
         *
         * @param sourceItemHandleScope - drag item handle scope.
         * @param destScope - sortable target scope.
         * @param destItemScope - sortable destination item scope.
         * @returns {*|boolean} - true if drop is allowed for the drag item in drop target.
         */
        $scope.accept = function(sourceItemHandleScope, destScope, destItemScope) {
            return $scope.callbacks.accept(sourceItemHandleScope, destScope, destItemScope);
        };

    }]);

    /**
     * Sortable directive - defines callbacks.
     * Parent directive for draggable and sortable items.
     * Sets modelValue, callbacks, element in scope.
     * sortOptions also includes a longTouch option which activates longTouch when set to true (default is false).
     */
    mainModule.directive('asSortable', ['sortableConfig', '$rootScope',
        function(sortableConfig, $rootScope) {
            return {
                require: 'ngModel', // get a hold of NgModelController
                restrict: 'A',
                scope: true,
                controller: 'as.sortable.sortableController',
                link: function(scope, element, attrs, ngModelController) {

                    var ngModel, callbacks;

                    ngModel = ngModelController;

                    if (!ngModel) {
                        return; // do nothing if no ng-model
                    }

                    // Set the model value in to scope.
                    ngModel.$render = function() {
                        scope.modelValue = ngModel.$modelValue;
                    };
                    //set the element in scope to be accessed by its sub scope.
                    scope.element = element;

                    element.on('mouseenter', _.throttle(function() {
                        if ($rootScope.application.dragging) {
                            sortableConfig.elementsOver.push(element);
                            element.addClass('sortable-container-over');
                        }
                    }, sortableConfig.throttle));
                    element.on('mouseleave', _.throttle(function() {
                        element.removeClass('sortable-container-over');
                    }, sortableConfig.throttle));

                    element.data('_scope', scope); // #144, work with angular debugInfoEnabled(false)

                    callbacks = {accept: null, orderChanged: null, itemMoved: null, dragStart: null, dragMove: null, dragCancel: null, dragEnd: null};

                    /**
                     * Invoked to decide whether to allow drop.
                     *
                     * @param sourceItemHandleScope - the drag item handle scope.
                     * @param destSortableScope - the drop target sortable scope.
                     * @param destItemScope - the drop target item scope.
                     * @returns {boolean} - true if allowed for drop.
                     */
                    callbacks.accept = function(sourceItemHandleScope, destSortableScope, destItemScope) {
                        return true;
                    };

                    /**
                     * Invoked when order of a drag item is changed.
                     *
                     * @param event - the event object.
                     */
                    callbacks.orderChanged = function(event) {
                    };

                    /**
                     * Invoked when the item is moved to other sortable.
                     *
                     * @param event - the event object.
                     */
                    callbacks.itemMoved = function(event) {
                    };

                    /**
                     * Invoked when the drag started successfully.
                     *
                     * @param event - the event object.
                     */
                    callbacks.dragStart = function(event) {
                    };

                    /**
                     * Invoked when the drag move.
                     *
                     * @param itemPosition - the item position.
                     * @param containment - the containment element.
                     * @param eventObj - the event object.
                     */
                    callbacks.dragMove = angular.noop;

                    /**
                     * Invoked when the drag cancelled.
                     *
                     * @param event - the event object.
                     */
                    callbacks.dragCancel = function(event) {
                    };

                    /**
                     * Invoked when the drag stopped.
                     *
                     * @param event - the event object.
                     */
                    callbacks.dragEnd = function(event) {
                    };

                    //Set the sortOptions callbacks else set it to default.
                    scope.$watch(attrs.asSortable, function(newVal, oldVal) {
                        angular.forEach(newVal, function(value, key) {
                            if (callbacks[key]) {
                                if (typeof value === 'function') {
                                    callbacks[key] = value;
                                }
                            } else {
                                scope.options[key] = value;
                            }
                        });
                        scope.callbacks = callbacks;
                    }, true);

                    // Set isDisabled if attr is set, if undefined isDisabled = false
                    if (angular.isDefined(attrs.isDisabled)) {
                        scope.$watch(attrs.isDisabled, function(newVal, oldVal) {
                            if (!angular.isUndefined(newVal)) {
                                element.toggleClass('as-sortable-disabled', newVal); // CUSTOM
                                scope.isDisabled = newVal;
                            }
                        }, true);
                    }
                }
            };
        }]);

}());

/*jshint indent: 2 */
/*global angular: false */

(function() {

    'use strict';
    var mainModule = angular.module('as.sortable');

    /**
     * Controller for sortableItemHandle
     *
     * @param $scope - item handle scope.
     */
    mainModule.controller('as.sortable.sortableItemHandleController', ['$scope', function($scope) {

        this.scope = $scope;

        $scope.itemScope = null;
        $scope.type = 'handle';
    }]);

    //Check if a node is parent to another node
    function isParent(possibleParent, elem) {
        if (!elem || elem.nodeName === 'HTML') {
            return false;
        }

        if (elem.parentNode === possibleParent) {
            return true;
        }

        return isParent(possibleParent, elem.parentNode);
    }

    /**
     * Directive for sortable item handle.
     */
    mainModule.directive('asSortableItemHandle', ['sortableConfig', '$helper', '$window', '$document', '$timeout', '$interval', '$rootScope',
        function(sortableConfig, $helper, $window, $document, $timeout, $interval, $rootScope) {
            return {
                // require: '^asSortableItem', CUSTOM: disabled to use soft return instead of throwing error
                scope: true,
                restrict: 'A',
                controller: 'as.sortable.sortableItemHandleController',
                link: function(scope, element, attrs, itemController) {

                    // CUSTOM
                    if (!element.closest('[as-sortable-item]').length) {
                        element.addClass('as-sortable-item-handle-disabled');
                        return;
                    }

                    var dragElement, //drag item element.
                        placeHolder, //place holder class element.
                        placeElement,//hidden place element.
                        itemPosition, //drag item element position.
                        dragItemInfo, //drag item data.
                        containment,//the drag container.
                        containerPositioning, // absolute or relative positioning.
                        dragListen,// drag listen event.
                        scrollableContainer, //the scrollable container
                        dragStart,// drag start event.
                        dragMove,//drag move event.
                        dragEnd,//drag end event.
                        dragCancel,//drag cancel event.
                        isDraggable,//is element draggable.
                        placeHolderIndex,//placeholder index in items elements.
                        bindDrag,//bind drag events.
                        unbindDrag,//unbind drag events.
                        bindEvents,//bind the drag events.
                        unBindEvents,//unbind the drag events.
                        hasTouch,// has touch support.
                        isIOS,// is iOS device.
                        longTouchStart, // long touch start event
                        longTouchCancel, // cancel long touch
                        longTouchTimer, // timer promise for the long touch on iOS devices
                        dragHandled, //drag handled.
                        createPlaceholder,//create place holder.
                        isPlaceHolderPresent,//is placeholder present.
                        isDisabled = false, // drag enabled
                        escapeListen, // escape listen event
                        // CUSTOM
                        // checking if dragMove callback exists, to prevent application
                        // rerenderings on each mouse move event
                        scrollSpeed = 0,
                        destScrollableContainer,
                        scheduledScroll = null,
                        cancelScheduledScroll = function() {
                            scrollSpeed = 0;
                            if (scheduledScroll) {
                                $interval.cancel(scheduledScroll);
                                scheduledScroll = null;
                            }
                        },
                        // END CUSTOM
                        isLongTouch = false; //long touch disabled.

                    hasTouch = 'ontouchstart' in $window;
                    isIOS = /iPad|iPhone|iPod/.test($window.navigator.userAgent) && !$window.MSStream;

                    if (sortableConfig.handleClass) {
                        element.addClass(sortableConfig.handleClass);
                    }

                    scope.itemScope = itemController.scope;
                    element.data('_scope', scope); // #144, work with angular debugInfoEnabled(false)

                    scope.$watchGroup(['sortableScope.isDisabled', function() { return !attrs.asSortableItemHandle || scope.$eval(attrs.asSortableItemHandle); }], function(newValues) {
                        // CUSTOM:
                        // - conditional handle
                        // - remove the isLongTouch watcher for better perfs, so this option cannot be enabled through the option param anymore (could be forced generally at true by setting isLongTouch = false above)
                        var globalDisabled = newValues[0];
                        var localDisabled = !newValues[1];
                        var newDisabled = globalDisabled || localDisabled;
                        if (isDisabled !== newDisabled) {
                            isDisabled = newDisabled;
                            element.toggleClass('as-sortable-item-handle-disabled', isDisabled);
                            // END CUSTOM
                            if (isDisabled) {
                                unbindDrag();
                            } else {
                                bindDrag();
                            }
                        } else {
                            bindDrag();
                        }
                    });

                    scope.$on('$destroy', function() {
                        angular.element($document[0].body).unbind('keydown', escapeListen);
                    });

                    createPlaceholder = function(itemScope) {
                        if (typeof scope.sortableScope.options.placeholder === 'function') {
                            return angular.element(scope.sortableScope.options.placeholder(itemScope));
                        } else if (typeof scope.sortableScope.options.placeholder === 'string') {
                            return angular.element(scope.sortableScope.options.placeholder);
                        } else {
                            return angular.element($document[0].createElement(itemScope.element.prop('tagName')));
                        }
                    };

                    /**
                     * Listens for a 10px movement before
                     * dragStart is called to allow for
                     * a click event on the element.
                     *
                     * @param event - the event object.
                     */
                    dragListen = function(event) {

                        var unbindMoveListen = function() {
                            angular.element($document).unbind('mousemove', moveListen);
                            angular.element($document).unbind('touchmove', moveListen);
                            element.unbind('mouseup', unbindMoveListen);
                            element.unbind('touchend', unbindMoveListen);
                            element.unbind('touchcancel', unbindMoveListen);
                        };

                        var startPosition;
                        var moveListen = function(e) {
                            e.preventDefault();
                            var eventObj = $helper.eventObj(e);
                            if (!startPosition) {
                                startPosition = {clientX: eventObj.clientX, clientY: eventObj.clientY};
                            }
                            if (Math.abs(eventObj.clientX - startPosition.clientX) + Math.abs(eventObj.clientY - startPosition.clientY) > 10) {
                                unbindMoveListen();
                                dragStart(event);
                            }
                        };

                        angular.element($document).bind('mousemove', moveListen);
                        angular.element($document).bind('touchmove', moveListen);
                        element.bind('mouseup', unbindMoveListen);
                        element.bind('touchend', unbindMoveListen);
                        element.bind('touchcancel', unbindMoveListen);
                        event.stopPropagation();
                        event.preventDefault();
                    };

                    /**
                     * Triggered when drag event starts.
                     *
                     * @param event the event object.
                     */
                    dragStart = function(event) {
                        var eventObj, tagName;

                        if (!hasTouch && (event.button === 2 || event.which === 3)) {
                            // disable right click
                            return;
                        }
                        if (hasTouch && $helper.isTouchInvalid(event)) {
                            return;
                        }
                        if (dragHandled || !isDraggable(event)) {
                            // event has already fired in other scope.
                            return;
                        }
                        // Set the flag to prevent other items from inheriting the drag event
                        dragHandled = true;
                        event.preventDefault();
                        eventObj = $helper.eventObj(event);
                        scope.sortableScope = scope.sortableScope || scope.itemScope.sortableScope; //isolate directive scope issue.
                        scope.callbacks = scope.callbacks || scope.itemScope.callbacks; //isolate directive scope issue.

                        if (scope.itemScope.sortableScope.options.clone || (scope.itemScope.sortableScope.options.ctrlClone && event.ctrlKey)) {
                            // Clone option is true
                            // or Ctrl clone option is true & the ctrl key was pressed when the user innitiated drag
                            scope.itemScope.sortableScope.cloning = true;
                        } else {
                            scope.itemScope.sortableScope.cloning = false;
                        }

                        // (optional) Scrollable container as reference for top & left offset calculations, defaults to Document
                        scrollableContainer = angular.element($document[0].querySelector(scope.sortableScope.options.scrollableContainer)).length > 0 ?
                                              $document[0].querySelector(scope.sortableScope.options.scrollableContainer) : $document[0].documentElement;

                        containment = (scope.sortableScope.options.containment) ? $helper.findAncestor(element, scope.sortableScope.options.containment) : angular.element($document[0].body);
                        //capture mouse move on containment.
                        containment.css('cursor', 'move');
                        containment.css('cursor', '-webkit-grabbing');
                        containment.css('cursor', '-moz-grabbing');
                        containment.addClass('as-sortable-un-selectable');

                        // container positioning
                        containerPositioning = scope.sortableScope.options.containerPositioning || 'absolute';

                        dragItemInfo = $helper.dragItem(scope);
                        tagName = scope.itemScope.element.prop('tagName');

                        dragElement = angular.element($document[0].createElement(scope.sortableScope.element.prop('tagName')))
                            .addClass(scope.sortableScope.element.attr('class')).addClass(sortableConfig.dragClass);
                        dragElement.css('width', $helper.width(scope.itemScope.element) + 'px');
                        dragElement.css('height', $helper.height(scope.itemScope.element) + 'px');

                        placeHolder = createPlaceholder(scope.itemScope)
                            .addClass(sortableConfig.placeHolderClass).addClass(scope.sortableScope.options.additionalPlaceholderClass);

                        if (!scope.sortableScope.options.placeholderDisableComputeBounds) {
                            placeHolder.css('width', $helper.width(scope.itemScope.element) + 'px');
                            placeHolder.css('height', $helper.height(scope.itemScope.element) + 'px');
                        }

                        placeElement = angular.element($document[0].createElement(tagName));
                        if (sortableConfig.hiddenClass) {
                            placeElement.addClass(sortableConfig.hiddenClass);
                        }

                        itemPosition = $helper.positionStarted(eventObj, scope.itemScope.element, scrollableContainer);

                        // fill the immediate vacuum.
                        if (!scope.itemScope.sortableScope.options.clone) {
                            scope.itemScope.element.after(placeHolder);
                        }

                        if (scope.itemScope.sortableScope.cloning) {
                            // clone option is enabled or triggered, so clone the element.
                            dragElement.append(scope.itemScope.element.clone());
                        }
                        else {
                            // add hidden placeholder element in original position.
                            scope.itemScope.element.addClass('as-sortable-dragging-item');
                            scope.itemScope.element.after(placeElement);
                            // not cloning, so use the original element.
                            dragElement.append(scope.itemScope.element);
                        }

                        containment.append(dragElement);
                        $helper.movePosition(eventObj, dragElement, itemPosition, containment, containerPositioning, scrollableContainer);

                        scope.sortableScope.$apply(function() {
                            scope.callbacks.dragStart(dragItemInfo.eventArgs());
                        });
                        bindEvents();
                    };

                    /**
                     * Allow Drag if it is a proper item-handle element.
                     *
                     * @param event - the event object.
                     * @return boolean - true if element is draggable.
                     */
                    isDraggable = function(event) {

                        var elementClicked, sourceScope, isDraggable;

                        elementClicked = angular.element(event.target);

                        // look for the handle on the current scope or parent scopes
                        sourceScope = fetchScope(elementClicked);

                        isDraggable = (sourceScope && sourceScope.type === 'handle');

                        //If a 'no-drag' element inside item-handle if any.
                        while (isDraggable && elementClicked[0] !== element[0]) {
                            if ($helper.noDrag(elementClicked)) {
                                isDraggable = false;
                            }
                            elementClicked = elementClicked.parent();
                        }
                        return isDraggable;
                    };

                    /**
                     * Inserts the placeHolder in to the targetScope.
                     *
                     * @param targetElement the target element
                     * @param targetScope the target scope
                     */
                    function insertBefore(targetElement, targetScope) {
                        // Ensure the placeholder is visible in the target (unless it's a table row)
                        if (placeHolder.css('display') !== 'table-row') {
                            placeHolder.css('display', 'block');
                        }
                        if (!targetScope.sortableScope.options.clone) {
                            targetElement[0].parentNode.insertBefore(placeHolder[0], targetElement[0]);
                            dragItemInfo.moveTo(targetScope.sortableScope, targetScope.index());
                        }
                    }

                    /**
                     * Inserts the placeHolder next to the targetScope.
                     *
                     * @param targetElement the target element
                     * @param targetScope the target scope
                     */
                    function insertAfter(targetElement, targetScope) {
                        // Ensure the placeholder is visible in the target (unless it's a table row)
                        if (placeHolder.css('display') !== 'table-row') {
                            placeHolder.css('display', 'block');
                        }
                        if (!targetScope.sortableScope.options.clone) {
                            targetElement.after(placeHolder);
                            dragItemInfo.moveTo(targetScope.sortableScope, targetScope.index() + 1);
                        }
                    }

                    /**
                     * Triggered when drag is moving.
                     *
                     * @param event - the event object.
                     */
                    dragMove = function(event) {
                        var eventObj, targetY, targetScope, targetElement;

                        if (hasTouch && $helper.isTouchInvalid(event)) {
                            return;
                        }
                        // Ignore event if not handled
                        if (!dragHandled) {
                            return;
                        }
                        if (dragElement) {

                            event.preventDefault();

                            eventObj = $helper.eventObj(event);
                            targetY = eventObj.pageY - ($window.pageYOffset || $document[0].documentElement.scrollTop);
                            var targetElements = angular.element('.sortable-item-over, .sortable-container-over:not(.as-sortable-drag)');
                            if (targetElements && targetElements.length > 1) { //it should not be the case but in case... xD
                                targetElement = angular.element(_.find(targetElements, function(targetElement) { return targetElement.className.indexOf('sortable-item-over') > 0}));
                                _.each(targetElements, function(el) {
                                    if (targetElement !== el) {
                                        $helper.cleanStyles(el);
                                    }
                                })
                            } else {
                                targetElement = targetElements;
                            }
                            // CUSTOM
                            if (eventObj) {
                                // This HORRIBLE SOUP isolated in a private function gets the dest panel body and stores it in a captured variable.
                                // There may be a better way but it is the way ng-sortable does it
                                (function(eventObj) {
                                    var destElement = angular.element(targetElement);

                                    function fetchScope(element) {
                                        var scope;
                                        while (!scope && element.length) {
                                            scope = element.data('_scope');
                                            if (!scope) {
                                                element = element.parent();
                                            }
                                        }
                                        return scope;
                                    }

                                    var destScope = fetchScope(destElement); // Retrieve the closest scope from the DOM element
                                    if (destScope) {
                                        destScrollableContainer = angular.element(destScope.element).closest(destScope.options.scrollableContainerSelector)[0]; // Store the dest scrollable container for later use
                                    }
                                })(eventObj);
                                // Retrieve scrollable container, very likely stored during a previous move, and scroll if needed (for the moment scroll occurs only when moving)
                                if (destScrollableContainer) {
                                    var marginAroundCursor = 30;
                                    var containerRect = $helper.boundingClient(destScrollableContainer);
                                    var topDifference = containerRect.top - targetY + marginAroundCursor;
                                    var bottomDifference = containerRect.bottom - targetY - marginAroundCursor;
                                    var cursorUpperThanPanel = topDifference > 0;
                                    var cursorLowerThanPanel = bottomDifference < 0;
                                    if (cursorUpperThanPanel || cursorLowerThanPanel) {
                                        var computeSpeed = function(difference) {
                                            return Math.floor(difference / 4); // Magic formula
                                        };
                                        scrollSpeed = cursorUpperThanPanel ? computeSpeed(topDifference) : computeSpeed(bottomDifference);
                                        var moveScroll = function() {
                                            if (destScrollableContainer) {
                                                destScrollableContainer.scrollTop = destScrollableContainer.scrollTop - scrollSpeed;
                                            }
                                        };
                                        moveScroll();
                                        // With the solution above, scroll occurs only when moving the cursor so we define a recurring callback to sustain the scroll when not moving
                                        if (!scheduledScroll) {
                                            var timeInterval = 4; // 4 ms scheduledScroll between each automatic scroll
                                            scheduledScroll = $interval(moveScroll, timeInterval);
                                        }
                                    } else if (scheduledScroll !== null) {
                                        cancelScheduledScroll();
                                    }
                                }
                            }
                            // END CUSTOM

                            if (scope.callbacks.dragMove !== angular.noop) {
                                scope.sortableScope.$apply(function() {
                                    scope.callbacks.dragMove(itemPosition, containment, eventObj);
                                });
                            }

                            //IE fixes: hide show element, call element from point twice to return pick correct element.
                            dragElement.addClass(sortableConfig.hiddenClass);
                            dragElement.removeClass(sortableConfig.hiddenClass);

                            $helper.movePosition(eventObj, dragElement, itemPosition, containment, containerPositioning, scrollableContainer);

                            //Set Class as dragging starts
                            dragElement.addClass(sortableConfig.dragging);

                            targetScope = fetchScope(targetElement);

                            if (!targetScope || !targetScope.type) {
                                return;
                            }
                            if (targetScope.type === 'handle') {
                                targetScope = targetScope.itemScope;
                            }
                            if (targetScope.type !== 'item' && targetScope.type !== 'sortable') {
                                return;
                            }

                            if (targetScope.type === 'item' && targetScope.accept(scope, targetScope.sortableScope, targetScope)) {
                                // decide where to insert placeholder based on target element and current placeholder if is present
                                targetElement = targetScope.element;

                                // Fix #241 Drag and drop have trembling with blocks of different size
                                var targetElementOffset = $helper.offset(targetElement, scrollableContainer, true);
                                if (!dragItemInfo.canMove(itemPosition, targetElement, targetElementOffset)) {
                                    return;
                                }
                                if (targetElement.hasClass('sortable-item-over-right')) {
                                    insertAfter(targetElement, targetScope);
                                } else {
                                    insertBefore(targetElement, targetScope);
                                }
                            } else {
                                $helper.cleanStyles();
                            }

                            if (targetScope.type === 'sortable') {//sortable scope.
                                if (targetScope.accept(scope, targetScope) &&
                                    !isParent(targetScope.element[0], targetElement[0])) {
                                    //moving over sortable bucket. not over item.
                                    if (!isPlaceHolderPresent(targetElement) && !targetScope.options.clone) {
                                        targetElement[0].appendChild(placeHolder[0]);
                                        dragItemInfo.moveTo(targetScope, targetScope.modelValue.length);
                                    }
                                }
                            }
                        }
                    };


                    /**
                     * Fetch scope from element or parents
                     * @param  {object} element Source element
                     * @return {object}         Scope, or null if not found
                     */
                    function fetchScope(element) {
                        var scope;
                        while (!scope && element.length) {
                            scope = element.data('_scope');
                            if (!scope) {
                                element = element.parent();
                            }
                        }
                        return scope;
                    }


                    /**
                     * Get position of place holder among item elements in itemScope.
                     * @param targetElement the target element to check with.
                     * @returns {*} -1 if placeholder is not present, index if yes.
                     */
                    placeHolderIndex = function(targetElement) {
                        var itemElements, i;
                        // targetElement is placeHolder itself, return index 0
                        if (targetElement.hasClass(sortableConfig.placeHolderClass)) {
                            return 0;
                        }
                        // find index in target children
                        itemElements = targetElement.children();
                        for (i = 0; i < itemElements.length; i += 1) {
                            //TODO may not be accurate when elements contain other siblings than item elements
                            //solve by adding 1 to model index of previous item element
                            if (angular.element(itemElements[i]).hasClass(sortableConfig.placeHolderClass)) {
                                return i;
                            }
                        }
                        return -1;
                    };


                    /**
                     * Check there is no place holder placed by itemScope.
                     * @param targetElement the target element to check with.
                     * @returns {*} true if place holder present. //TODO REMOVE
                     */
                    isPlaceHolderPresent = function(targetElement) {
                        return placeHolderIndex(targetElement) >= 0;
                    };

                    /**
                     * Rollback the drag data changes.
                     */

                    function rollbackDragChanges() {
                        if (!scope.itemScope.sortableScope.cloning) {
                            scope.itemScope.element.removeClass('as-sortable-dragging-item');
                            placeElement.replaceWith(scope.itemScope.element);
                        }
                        placeHolder.remove();
                        dragElement.remove();
                        dragElement = null;
                        dragHandled = false;
                        containment.css('cursor', '');
                        containment.removeClass('as-sortable-un-selectable');
                        $helper.cleanCache();
                    }

                    /**
                     * triggered while drag ends.
                     *
                     * @param event - the event object.
                     */
                    dragEnd = function(event) {
                        // Ignore event if not handled
                        if (!dragHandled) {
                            return;
                        }
                        cancelScheduledScroll(); // Prevent persistent scroll in case of release out of sortable container
                        event.preventDefault();
                        if (dragElement) {
                            //rollback all the changes.
                            rollbackDragChanges();
                            // update model data
                            dragItemInfo.apply();
                            scope.sortableScope.$apply(function() {
                                if (dragItemInfo.isSameParent()) {
                                    if (dragItemInfo.isOrderChanged()) {
                                        scope.callbacks.orderChanged(dragItemInfo.eventArgs());
                                    }
                                } else {
                                    scope.callbacks.itemMoved(dragItemInfo.eventArgs());
                                }
                            });
                            scope.sortableScope.$apply(function() {
                                scope.callbacks.dragEnd(dragItemInfo.eventArgs());
                            });
                            dragItemInfo = null;
                        }
                        unBindEvents();
                    };

                    /**
                     * triggered while drag is cancelled.
                     *
                     * @param event - the event object.
                     */
                    dragCancel = function(event) {
                        // Ignore event if not handled
                        if (!dragHandled) {
                            return;
                        }
                        event.preventDefault();

                        if (dragElement) {
                            //rollback all the changes.
                            rollbackDragChanges();
                            scope.sortableScope.$apply(function() {
                                scope.callbacks.dragCancel(dragItemInfo.eventArgs());
                            });
                            dragItemInfo = null;
                        }
                        unBindEvents();
                    };

                    /**
                     * Binds the drag start events.
                     */
                    bindDrag = function() {
                        if (hasTouch) {
                            if (isIOS) {
                                element.bind('touchstart', longTouchStart);
                                element.bind('touchend', longTouchCancel);
                                element.bind('touchmove', longTouchCancel);
                            } else {
                                element.bind('contextmenu', dragListen);
                            }
                        }
                        element.bind('mousedown', dragListen);
                    };

                    /**
                     * Unbinds the drag start events.
                     */
                    unbindDrag = function() {
                        element.unbind('touchstart', longTouchStart);
                        element.unbind('touchend', longTouchCancel);
                        element.unbind('touchmove', longTouchCancel);
                        element.unbind('contextmenu', dragListen);
                        element.unbind('touchstart', dragListen);
                        element.unbind('mousedown', dragListen);
                    };

                    /**
                     * starts a timer to detect long touch on iOS devices. If touch held for more than 500ms,
                     * it would be considered as long touch.
                     *
                     * @param event - the event object.
                     */
                    longTouchStart = function(event) {
                        longTouchTimer = $timeout(function() {
                            dragListen(event);
                        }, 500);
                    };

                    /**
                     * cancel the long touch and its timer.
                     */
                    longTouchCancel = function() {
                        $timeout.cancel(longTouchTimer);
                    };

                    //bind drag start events.
                    //put in a watcher since this method is now depending on the longtouch option from sortable.sortOptions
                    //bindDrag();

                    //Cancel drag on escape press.
                    escapeListen = function(event) {
                        if (event.keyCode === 27) {
                            dragCancel(event);
                        }
                    };
                    angular.element($document[0].body).bind('keydown', escapeListen);

                    /**
                     * Binds the events based on the actions.
                     */
                    var dragMoveThrottled = _.throttle(dragMove, sortableConfig.throttle);
                    bindEvents = function() {
                        $rootScope.application.dragging = true;
                        angular.element($document).bind('touchmove', dragMoveThrottled);
                        angular.element($document).bind('touchend', dragEnd);
                        angular.element($document).bind('touchcancel', dragCancel);
                        angular.element($document).bind('mousemove', dragMoveThrottled);
                        angular.element($document).bind('mouseup', dragEnd);
                    };

                    /**
                     * Un binds the events for drag support.
                     */
                    unBindEvents = function() {
                        $rootScope.application.dragging = false;
                        angular.element($document).unbind('touchend', dragEnd);
                        angular.element($document).unbind('touchcancel', dragCancel);
                        angular.element($document).unbind('touchmove', dragMoveThrottled);
                        angular.element($document).unbind('mouseup', dragEnd);
                        angular.element($document).unbind('mousemove', dragMoveThrottled);
                        $helper.cleanStyles();
                    };
                }
            };
        }]);
}());

/*jshint indent: 2 */
/*global angular: false */

(function() {

    'use strict';
    var mainModule = angular.module('as.sortable');

    /**
     * Controller for sortable item.
     *
     * @param $scope - drag item scope
     */
    mainModule.controller('as.sortable.sortableItemController', ['$scope', function($scope) {

        this.scope = $scope;

        $scope.sortableScope = null;
        $scope.modelValue = null; // sortable item.
        $scope.type = 'item';

        /**
         * returns the index of the drag item from the sortable list.
         *
         * @returns {*} - index value.
         */
        $scope.index = function() {
            return $scope.$index;
        };

        /**
         * Returns the item model data.
         *
         * @returns {*} - item model value.
         */
        $scope.itemData = function() {
            return $scope.sortableScope.modelValue[$scope.$index];
        };

    }]);

    /**
     * sortableItem directive.
     */
    mainModule.directive('asSortableItem', ['sortableConfig', '$rootScope', '$helper',
        function(sortableConfig, $rootScope, $helper) {
            return {
                require: ['^asSortable', '?ngModel'],
                restrict: 'A',
                controller: 'as.sortable.sortableItemController',
                link: function(scope, element, attrs, ctrl) {
                    var sortableController = ctrl[0];
                    var ngModelController = ctrl[1];
                    if (sortableConfig.itemClass) {
                        element.addClass(sortableConfig.itemClass);
                    }
                    scope.sortableScope = sortableController.scope;
                    if (ngModelController) {
                        ngModelController.$render = function() {
                            scope.modelValue = ngModelController.$modelValue;
                        };
                    } else {
                        scope.modelValue = sortableController.scope.modelValue[scope.$index];
                    }
                    scope.element = element;
                    element.on('mousemove', _.throttle(function(e) {
                        if ($rootScope.application.dragging && !element.hasClass('as-sortable-dragging-item')) {
                            var offset = $helper.offset(element, null, false);
                            var x = e.pageX - offset.left;
                            var y = e.pageY - offset.top;
                            $helper.cleanStyles();
                            element.addClass('sortable-item-over sortable-item-over-' + (x > ((offset.width / 2) || y > (offset.height / 2)) ? 'right' : 'left'));
                        }
                    }, sortableConfig.throttle));
                    element.on('mouseleave', _.throttle(function() {
                        element.removeClass('sortable-item-over sortable-item-over-left sortable-item-over-right');
                    }, sortableConfig.throttle));
                    element.data('_scope', scope); // #144, work with angular debugInfoEnabled(false)
                }
            };
        }]);

}());