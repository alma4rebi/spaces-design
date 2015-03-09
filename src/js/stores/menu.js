/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

define(function (require, exports, module) {
    "use strict";

    var Fluxxor = require("fluxxor"),
        Immutable = require("immutable"),
        MenuBar = require("js/models/menubar"),
        events = require("../events");

    /**
     * The Menu store keeps track of the application menu
     * and the state of items in it
     * 
     * @constructor
     */
    var MenuStore = Fluxxor.createStore({
        /**
         * Current application menubar
         * 
         * @private
         * @type {MenuBar}
         */
        _applicationMenu: null,

        /**
         * Initialize the policy sets
         */
        initialize: function () {
            this._applicationMenu = new MenuBar();

            this.bindActions(
                events.application.UPDATE_RECENT_FILES, this._updateRecentFiles,
                events.menus.INIT_MENUS, this._handleMenuInitialize,
                events.menus.UPDATE_MENUS, this._updateMenuItems,
                events.document.DOCUMENT_UPDATED, this._updateMenuItems,
                events.document.CLOSE_DOCUMENT, this._updateMenuItems,
                events.document.RESET_DOCUMENTS, this._updateMenuItems,
                events.document.RESET_LAYERS, this._updateMenuItems,
                events.document.SELECT_DOCUMENT, this._updateMenuItems,
                events.document.SELECT_LAYERS_BY_INDEX, this._updateMenuItems,
                events.document.SELECT_LAYERS_BY_ID, this._updateMenuItems,
                events.document.DELETE_LAYERS, this._updateMenuItems,
                events.document.GROUP_SELECTED, this._updateMenuItems

            );
        },

        /**
         * Returns the current application menu object
         *
         * @return {MenuBar}
         */
        getApplicationMenu: function () {
            return this._applicationMenu;
        },

        /**
         * Dispatched by menu actions when json files are first loaded
         * Initializes the menus in a MenuBar object
         *
         * Menu actions listen to the change event from this store,
         * and send a installMenu call to Photoshop. 
         * 
         * This is unique to this situation, because we skip the 
         * React component in the Flux cycle
         *
         * @private
         * @param {{menus: <object>, actions: <object>}} payload
         */
        _handleMenuInitialize: function (payload) {
            this._applicationMenu = MenuBar.fromJSONObjects(payload.menus, payload.actions);

            this.emit("change");
        },

        /**
         * This is our main listener for most of the events in the app
         * that cause a change in document or selection that would cause
         * a menu item to be disabled
         *
         * @private
         */
        _updateMenuItems: function () {
            this.waitFor(["document", "application"], function (docStore, appStore) {
                var document = appStore.getCurrentDocument(),
                    openDocuments = docStore.getAllDocuments(),
                    oldMenu = this._applicationMenu;
                    
                this._applicationMenu = this._applicationMenu.updateMenuItems(document);
                this._applicationMenu = this._applicationMenu.updateOpenDocuments(openDocuments, document);

                if (!Immutable.is(oldMenu, this._applicationMenu)) {
                    this.emit("change");
                }
            }.bind(this));
        },

        /**
         * Updates the recent files menu
         * @private
         */
        _updateRecentFiles: function () {
            this.waitFor(["application"], function (appStore) {
                var recentFiles = appStore.getRecentFiles(),
                    oldMenu = this._applicationMenu;

                this._applicationMenu = this._applicationMenu.updateRecentFiles(recentFiles);

                if (!Immutable.is(oldMenu, this._applicationMenu)) {
                    this.emit("change");
                }
            }.bind(this));
        }
    });

    module.exports = MenuStore;
});