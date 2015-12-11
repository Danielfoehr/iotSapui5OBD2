/*global history */
sap.ui.define([
	"Vorlage/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"Vorlage/model/formatter"
], function(BaseController, JSONModel, Filter, FilterOperator, Sorter, GroupHeaderListItem, Device, formatter) {
	"use strict";
	var controllerReference;
	
	return BaseController.extend("Vorlage.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {
			
			var XSJSJSONModel ; // Model filled with Mock or Real Data later
			var masterList = this.byId("List1");
			var masterPage = this.byId("masterPage");
			
			
			var count = "undefined";
			
			controllerReference = this;
			
//BEGIN OF AJAX CALL &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&6	
				
			//replace <yourAccountId>
			var aUrl = "https://s9hanaxs.hanatrial.ondemand.com/<yourAccountId>trial/iot/ODBService.xsjs?cmd=retrieveMasterData";
			
			jQuery.ajax({
					url: aUrl,
					method: 'GET',
					dataType: 'JSON',
					success: function(Result) { 
						
				/*	C_TDISTANCE": "330",
    				"C_TRIPID": "1",
    				 "C_TRIPDAY": "11/05/2015"*/
    				 
						//for title of master list
						count = Result.results.length;
						masterPage.setTitle("Trips("+count+")");
						
						XSJSJSONModel = new sap.ui.model.json.JSONModel(Result);
						masterList.setModel(XSJSJSONModel);
						

	},
					//always gets called when not deployed to hana in trial mode: CORS not allowed -> take identical testdata then the XSJS service, called with AJAX, would return.
					error: function(jqXHR, textStatus, errorThrown) { 
						
						XSJSJSONModel = new JSONModel("../testdata.json");
						masterList.setModel(XSJSJSONModel);
 
						//For testing purposes
						count = 10;
						masterPage.setTitle("Trips("+count+")");
						
					
					}
			});
			
//END OF AJAX CALL $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


				var oList = this.byId("List1"),
					MasterViewModel = new JSONModel({
					isFilterBarVisible: false,
					filterBarLabel: "",
					delay: 0,
					title: "Trips(" + count.toString() + ")" ,
					noDataText: this.getResourceBundle().getText("masterListNoDataText"),
					sortBy: "C_TRIPID",
					groupBy: "None"
				}) ;
		

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			//Set MasterModel to Master View 
			this.setModel(MasterViewModel, "masterView");

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
			
			
			
			
			
		},
		
	onUpdateFinished: function(oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();
		},
		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("C_TRIPID", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			//Reload Master List
			controllerReference.onInit();
		},

		/**
		 * Event handler for the sorter selection.
		 * @param {sap.ui.base.Event} oEvent the select event
		 * @public
		 */
		onSort: function(oEvent) {
			var sKey = oEvent.getSource().getSelectedItem().getKey(),
				oViewModel = this.getModel("masterView"),
				sGroupKey = oViewModel.getProperty("/groupBy");

			if (sGroupKey !== "None" && sKey !== sGroupKey) {
				// If the list is grouped by something different than the new sorting, remove the grouping
				// Grouping only works if the list is primary sorted by the grouping
				oViewModel.setProperty("/groupBy", "None");
			}

			this._applyGroupSort([new Sorter(sKey, false)]);
		},


		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function(oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
		
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},
		
		onPressItem: function(oEvent) {
			//only called when you press on objectListItem in master list on a mobile device
			//works because of this line in Master.view type="{= ${device>/system/phone} ? 'Active' : 'Inactive'}" in object list item
			
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page
		 * @override
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function() {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("C_TRIPID");
					this.getRouter().navTo("object", {
						objectId: sObjectId
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function(oItem) {
		
			var bReplace = !Device.system.phone;
				this.getRouter().navTo("object", {
				AddParameter: oItem.getBindingContext().getProperty("C_TRIPID")
			}, bReplace);
			
			
		},
		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @private
		 */
		_applyGroupSort: function(aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		}
		

	});

});