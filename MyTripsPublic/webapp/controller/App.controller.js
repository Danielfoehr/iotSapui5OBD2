sap.ui.define([
	"Vorlage/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("Vorlage.controller.App", {

		onInit: function() {
			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}

	});

});