function initModel() {
	var sUrl = "/sap/opu/odata/sap/Z_ORDENES_MANTENIMIENTO_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}