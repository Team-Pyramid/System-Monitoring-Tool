var tablefinaldata = [];
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "sap/ui/model/Filter",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Text"
],
    function (Controller, ChartFormatter, Format, Filter, BusyIndicator, MessageBox, Dialog, Button, mobileLibrary, List, StandardListItem, Text) {
        "use strict";
        var ButtonType = mobileLibrary.ButtonType;
        var DialogType = mobileLibrary.DialogType;

        return Controller.extend("zdumpmoniv3.controller.View1", {
            onInit: function () {
                var toolHeading;
                var t = window.location.host;
                if (t.includes("s4d")) {
                    toolHeading = "S/4 HANA System Monitoring Tool - S4D System";
                }
                else if (t.includes("fioriint")) {
                    toolHeading = "S/4 HANA System Monitoring Tool - DFS System";
                } else if (t.includes("fioristg")) {
                    toolHeading = "S/4 HANA System Monitoring Tool - D1S System";
                } else {
                    toolHeading = "S/4 HANA System Monitoring Tool - S4P System";
                }

                this.getView().byId("id_ToolLabel").setText(toolHeading);

                //set Current Date
                var minDate = new Date;
                minDate.setHours("05");
                minDate.setMinutes("30");
                minDate.setSeconds("00");
                var maxDate = new Date;
                // maxDate.setHours("23");
                // maxDate.setMinutes("59");
                // maxDate.setSeconds("59");
                // maxDate.setHours(maxDate.getHours() + 5);
                // maxDate.setMinutes(maxDate.getMinutes() + 30);
                this.getView().byId("datum").setDateValue(minDate);
                this.getView().byId("datum").setSecondDateValue(maxDate);



            },

            getFilterObject: function (path, operator, value1, value2) {
                return new Filter({
                    path: path,
                    operator: operator,
                    value1: value1,
                    value2: value2,
                    and: true
                });
            },

            onLinkPress: function (oEvent) {

                // var arrayData = this.getView().getModel("tabledata").getData().items;
                var prog = oEvent.getSource().getText();
                var result = tablefinaldata.find(obj => {
                    return obj.cprog === prog
                })
                window.open(result.uri, "_blank")

            },

            onLogNumberPress: function (oEvent) {

                var aLogFilters = [];
                var oModel = this.getView().getModel("ZUTCF_BSB_APPL_LOG_MSG");
                aLogFilters.push(this.getFilterObject("log_Number", "EQ", oEvent.getSource().getText()));
                var logNumber = oEvent.getSource().getText();

                oModel.read("/zutcf_appl_log_msg", {
                    filters: aLogFilters,
                    success: function (oData, response) {


                        var oLogNumberDrillDown = oData.results;
                        var sampleData = new sap.ui.model.json.JSONModel({
                            items: []
                        });
                        this.getView().setModel(sampleData, "appLogDrillData");
                        this.getView().getModel("appLogDrillData").setData({
                            items: oLogNumberDrillDown
                        });



                        console.log("Read success:", oData);
                        if (!this.oDefaultDialog) {
                            this.oDefaultDialog = new Dialog({
                                title: "Detailed Messages",
                                content: new List({
                                    items: {
                                        path: "appLogDrillData>/items",
                                        template: new StandardListItem({
                                            title: "{appLogDrillData>msg_text}",
                                            description: "{appLogDrillData>msg_id}"
                                            // counter: "{appLogDrillData>msg_id}"
                                        })
                                    }
                                }),
                                beginButton: new Button({
                                    type: ButtonType.Emphasized,
                                    text: "OK",
                                    press: function () {
                                        this.oDefaultDialog.close();
                                    }.bind(this)
                                }),
                                endButton: new Button({
                                    text: "Close",
                                    press: function () {
                                        this.oDefaultDialog.close();
                                    }.bind(this)
                                })
                            });

                            // to get access to the controller's model
                            this.getView().addDependent(this.oDefaultDialog);
                        }

                        this.oDefaultDialog.open();
                    }.bind(this),
                    error: function (oError) {
                        console.error("Read error:", oError);
                    }
                });



            },

            onOperationIdPress: function (oEvent) {

                var oODataLogBinding = null;
                if(oEvent.getSource().getParent().getBindingContext("oFrontendDataLogData")) {
                    oODataLogBinding = oEvent.getSource().getParent().getBindingContext("oFrontendDataLogData");
                } else if (oEvent.getSource().getParent().getBindingContext("oBackendDataLogData")) {
                    oODataLogBinding = oEvent.getSource().getParent().getBindingContext("oBackendDataLogData");
                }
                var selectedRowOperId = oODataLogBinding.sPath.split("/")[2];
                var operationId = oODataLogBinding.getModel().getData().items[selectedRowOperId].opid;
                var oDataLogData = this.getView().getModel("oDataLogData").getData().items;
                
                // Find the row with matching operation ID
                var result = oDataLogData.find(obj => {
                    return obj.opid === operationId
                });
                
                // Navigate to the URI if found
                if (result && result.uri) {
                    window.open(result.uri, "_blank");
                } else {
                    MessageBox.warning("No URI found for this Operation ID");
                }

            },

            onObjectPress: function (oEvent) {

                var localUrl = 'https://fioris4d151.autodesk.com/sap/bc/ui2/flp?sap-client=151#ApplicationLog-showList&/PersKey/default/LogObjectId/GLO_LOG_MASSUPLOAD/LogObjectSubId/HSNSAC/LogExternalId//DateFrom//DateTo//Feature//LogHandleList//ShowAsTree'

                window.open(localUrl, "_blank")

            },

            handleDateChange: function (oEvent) {

                var now = new Date;
                if (this.getView().byId("datum").mProperties.secondDateValue > now) {
                    if (now.toDateString() === this.getView().byId("datum").mProperties.secondDateValue.toDateString()) {
                    } else {
                        MessageBox.error("Future Date is not allowed");
                        BusyIndicator.hide();
                        return;
                    }
                }

                // this.getView().byId("datum").mProperties.dateValue.setHours(this.getView().byId("datum").mProperties.dateValue.getHours() + 5);
                // this.getView().byId("datum").mProperties.dateValue.setMinutes(this.getView().byId("datum").mProperties.dateValue.getMinutes() + 30);

                // this.getView().byId("datum").mProperties.secondDateValue.setHours(this.getView().byId("datum").mProperties.secondDateValue.getHours() + 5);
                // this.getView().byId("datum").mProperties.secondDateValue.setMinutes(this.getView().byId("datum").mProperties.secondDateValue.getMinutes() + 30);
                
            },

            onSearch: function () {
                BusyIndicator.show();

                var aFilters = [];
                var aAppLogFilters = [];
                var aODataLogFilters = [];
                var aIdocLogFilters = [];

                // if (this.getView().byId("smartFilterBar").getFilterData().datum) {
                //     this.getView().byId("smartFilterBar").getFilterData().datum.ranges.forEach(function (sdatum) {
                //         sdatum.value1.setHours('05'); sdatum.value1.setMinutes('30');
                //         if (sdatum.value2) {
                //             sdatum.value2.setHours('05'); sdatum.value2.setMinutes('30');
                //         }
                //         aFilters.push(this.getFilterObject("datum", sdatum.operation, sdatum.value1, sdatum.value2));
                //         aAppLogFilters.push(this.getFilterObject("datum", sdatum.operation, sdatum.value1, sdatum.value2));

                //     }.bind(this));


                // } 




                // var now = new Date;
                // if (this.getView().byId("datum").mProperties.secondDateValue > now) {
                //     if (now.toDateString() === this.getView().byId("datum").mProperties.secondDateValue.toDateString()) {
                //     } else {
                //         MessageBox.error("Future Date is not allowed");
                //         BusyIndicator.hide();
                //         return;
                //     }
                // }

                // this.getView().byId("datum").mProperties.dateValue.setHours(this.getView().byId("datum").mProperties.dateValue.getHours() + 5);
                // this.getView().byId("datum").mProperties.dateValue.setMinutes(this.getView().byId("datum").mProperties.dateValue.getMinutes() + 30);

                // this.getView().byId("datum").mProperties.secondDateValue.setHours(this.getView().byId("datum").mProperties.secondDateValue.getHours() + 5);
                // this.getView().byId("datum").mProperties.secondDateValue.setMinutes(this.getView().byId("datum").mProperties.secondDateValue.getMinutes() + 30);

                // if (this.getView().byId("datum").mProperties.dateValue) {
                //     aFilters.push(this.getFilterObject("datum", "BT", this.getView().byId("datum").mProperties.dateValue, this.getView().byId("datum").mProperties.secondDateValue));
                //     aAppLogFilters.push(this.getFilterObject("datum", "BT", this.getView().byId("datum").mProperties.dateValue, this.getView().byId("datum").mProperties.secondDateValue));
                // }
                // else {
                //     MessageBox.error("Date is mandatory to fill");
                //     BusyIndicator.hide();
                //     return;
                // }

                var minDatedate = this.byId("datum").mProperties.dateValue.toString().substring(8, 10);
                var minDateyear = this.byId("datum").mProperties.dateValue.toString().substring(11, 15);
                var minDatemonth = (this.byId("datum").mProperties.dateValue.getMonth() + 1).toString();
                if (minDatemonth.length === 1) {
                    minDatemonth = "0" + minDatemonth;
                }
                if (minDatedate.length === 1) {
                    minDatedate = "0" + minDatedate;
                }
                var minDate = minDateyear + minDatemonth + minDatedate;

                var maxDatedate = this.byId("datum").mProperties.secondDateValue.toString().substring(8, 10);
                var maxDateyear = this.byId("datum").mProperties.secondDateValue.toString().substring(11, 15);
                var maxDatemonth = (this.byId("datum").mProperties.secondDateValue.getMonth() + 1).toString();
                if (maxDatemonth.length === 1) {
                    maxDatemonth = "0" + maxDatemonth;
                }
                if (minDatedate.length === 1) {
                    maxDatedate = "0" + maxDatedate;
                }


                var maxDate = maxDateyear + maxDatemonth + maxDatedate;
                var oDateFrom = this.byId("datum").getDateValue().toISOString();   
                var dateFrom = oDateFrom.split("T")[0];     
                var oDateTo = this.byId("datum").getSecondDateValue().toISOString();
                var dateTo = oDateTo.split("T")[0];            

                // var minDate = this.getView().byId("datum").mProperties.dateValue;
                // minDate.setHours(minDate.getHours() + 5);
                // minDate.setMinutes(minDate.getMinutes() + 30);

                // var maxDate = this.getView().byId("datum").mProperties.secondDateValue;
                // maxDate.setHours(maxDate.getHours() + 5);
                // maxDate.setMinutes(maxDate.getMinutes() + 30);

                // if (this.getView().byId("datum").mProperties.dateValue) {
                //     aFilters.push(this.getFilterObject("datum", "BT", minDate, maxDate));
                //     aAppLogFilters.push(this.getFilterObject("datum", "BT", minDate, maxDate));
                // }
                // else {
                //     MessageBox.error("Date is mandatory to fill");
                //     BusyIndicator.hide();
                //     return;
                // }

                // Added filter data query for search


                // Date Handling for Annotations - @Consumption.filter.selectionType: #interval
                // if (this.getView().byId("smartFilterBar").getFilterData().datum) {
                //     this.getView().byId("smartFilterBar").getFilterData().datum.ranges.forEach(function (sdatum) {
                //         aFilters.push(this.getFilterObject("datum", sdatum.operation, sdatum.value1, sdatum.value2));
                //         aAppLogFilters.push(this.getFilterObject("datum", sdatum.operation, sdatum.value1, sdatum.value2));
                //     }.bind(this));
                // }

                aFilters.push(this.getFilterObject("datum", "BT", minDate, maxDate));
                aAppLogFilters.push(this.getFilterObject("datum", "BT", minDate, maxDate));
                aODataLogFilters.push(new Filter("datum", sap.ui.model.FilterOperator.GE, dateFrom));
                aODataLogFilters.push(new Filter("datum", sap.ui.model.FilterOperator.LE, dateTo));
                aIdocLogFilters.push(new Filter("datum", sap.ui.model.FilterOperator.GE, dateFrom));
                aIdocLogFilters.push(new Filter("datum", sap.ui.model.FilterOperator.LE, dateTo));

                //Developer
                if (this.getView().byId("smartFilterBar").getFilterData().devpr) {
                    if (this.getView().byId("smartFilterBar").getFilterData().devpr.ranges.length > 0) {
                        this.getView().byId("smartFilterBar").getFilterData().devpr.ranges.forEach(function (sdevpr) {
                            aFilters.push(this.getFilterObject("uname", sdevpr.operation, sdevpr.value1, sdevpr.value2));
                            aAppLogFilters.push(this.getFilterObject("user_id", sdevpr.operation, sdevpr.value1, sdevpr.value2));
                            aODataLogFilters.push(this.getFilterObject("username", sdevpr.operation, sdevpr.value1, sdevpr.value2));
                            aIdocLogFilters.push(this.getFilterObject("username", sdevpr.operation, sdevpr.value1, sdevpr.value2));
                        }.bind(this));
                    }

                    if (this.getView().byId("smartFilterBar").getFilterData().devpr.items.length > 0) {
                        this.getView().byId("smartFilterBar").getFilterData().devpr.items.forEach(function (sdevpr) {
                            aFilters.push(this.getFilterObject("uname", "EQ", sdevpr.key));
                            aAppLogFilters.push(this.getFilterObject("user_id", "EQ", sdevpr.key));
                            aODataLogFilters.push(this.getFilterObject("username", "EQ", sdevpr.key));
                            aIdocLogFilters.push(this.getFilterObject("username", "EQ", sdevpr.key));
                        }.bind(this));
                    }

                }

                //Team
                if (this.getView().byId("smartFilterBar").getFilterData().zteam) {
                    if (this.getView().byId("smartFilterBar").getFilterData().zteam.ranges.length > 0) {
                        this.getView().byId("smartFilterBar").getFilterData().zteam.ranges.forEach(function (szteam) {
                            aFilters.push(this.getFilterObject("zteam", szteam.operation, szteam.value1, szteam.value2));
                            aAppLogFilters.push(this.getFilterObject("engineering_team", szteam.operation, szteam.value1, szteam.value2));
                            aODataLogFilters.push(this.getFilterObject("zteam", szteam.operation, szteam.value1, szteam.value2));
                            aIdocLogFilters.push(this.getFilterObject("zteam", szteam.operation, szteam.value1, szteam.value2));

                        }.bind(this));
                    }

                    if (this.getView().byId("smartFilterBar").getFilterData().zteam.items.length > 0) {
                        this.getView().byId("smartFilterBar").getFilterData().zteam.items.forEach(function (szteam) {
                            aFilters.push(this.getFilterObject("zteam", "EQ", szteam.key));
                            aAppLogFilters.push(this.getFilterObject("engineering_team", "EQ", szteam.key));
                            aODataLogFilters.push(this.getFilterObject("zteam", "EQ", szteam.key));
                            aIdocLogFilters.push(this.getFilterObject("zteam", "EQ", szteam.key));
                        }.bind(this));
                    }
                }

                //Exception Raised
                if (this.getView().byId("smartFilterBar").getFilterData().excep) {
                    this.getView().byId("smartFilterBar").getFilterData().excep.ranges.forEach(function (sexcep) {
                        aFilters.push(this.getFilterObject("excep", sexcep.operation, sexcep.value1, sexcep.value2));
                    }.bind(this));
                }

                //Cancelled Program
                if (this.getView().byId("smartFilterBar").getFilterData().cprog) {
                    this.getView().byId("smartFilterBar").getFilterData().cprog.ranges.forEach(function (sexcep) {
                        aFilters.push(this.getFilterObject("cprog", sexcep.operation, sexcep.value1, sexcep.value2));
                    }.bind(this));
                }

                //Domain
                if (this.getView().byId("smartFilterBar").getFilterData().zdomain) {
                    if (this.getView().byId("smartFilterBar").getFilterData().zdomain.ranges.length > 0) {
                        this.getView().byId("smartFilterBar").getFilterData().zdomain.ranges.forEach(function (sdomain) {
                            aFilters.push(this.getFilterObject("zdomain", sdomain.operation, sdomain.value1, sdomain.value2));
                            aAppLogFilters.push(this.getFilterObject("domain_name", sdomain.operation, sdomain.value1, sdomain.value2));
                            aODataLogFilters.push(this.getFilterObject("zdomain", sdomain.operation, sdomain.value1, sdomain.value2));
                            aIdocLogFilters.push(this.getFilterObject("zdomain", sdomain.operation, sdomain.value1, sdomain.value2));
                        }.bind(this));
                    }

                    if (this.getView().byId("smartFilterBar").getFilterData().zdomain.items.length > 0) {
                        this.getView().byId("smartFilterBar").getFilterData().zdomain.items.forEach(function (sdomain) {
                            aFilters.push(this.getFilterObject("zdomain", "EQ", sdomain.key));
                            aAppLogFilters.push(this.getFilterObject("domain_name", "EQ", sdomain.key));
                            aODataLogFilters.push(this.getFilterObject("zdomain", "EQ", sdomain.key));
                            aIdocLogFilters.push(this.getFilterObject("zdomain", "EQ", sdomain.key));
                        }.bind(this));
                    }
                }

                // App Log Odata Call

                this.getOwnerComponent().getModel("ZUTCF_BSB_APPL_LOG").read("/zutcf_application_log", {
                    filters: aAppLogFilters,
                    urlParameters: {
                        "$top": 10000,
                        "$orderby": "datum"
                    },
                    success: function (oData, oResponse) {

                        for (var i = 0; i < oData.results.length; i++) {
                            oData.results[i].datum = oData.results[i].datum.substring(6, 8) + "/" + oData.results[i].datum.substring(4, 6) + "/" + oData.results[i].datum.substring(0, 4);
                            // oData.results[i].datum = oData.results[i].datum.toLocaleDateString();
                            var h = Math.floor(oData.results[i].uzeit.ms / 1000 / 60 / 60);
                            var m = Math.floor((oData.results[i].uzeit.ms / 1000 / 60 / 60 - h) * 60);
                            var s = Math.floor(((oData.results[i].uzeit.ms / 1000 / 60 / 60 - h) * 60 - m) * 60);
                            oData.results[i].uzeit = h + ":" + m + ":" + s;
                        }

                        var applogDataRaw = oData.results;
                        var sampleDatajsonAppLog = new sap.ui.model.json.JSONModel({
                            items: []
                        });
                        this.getView().setModel(sampleDatajsonAppLog, "appLogData");
                        this.getView().getModel("appLogData").setData({
                            items: applogDataRaw
                        });

                        this.getView().byId("id_applogtab").setCount(applogDataRaw.length);


                        // graph data prep
                        var graphData = [];
                        for (var i = 0; i < applogDataRaw.length; i++) {
                            if (i === 0) {
                                var obj = {
                                    "Geo": applogDataRaw[0].engineering_team,
                                    "Revenue": 1
                                };
                                graphData.push(obj);
                            } else {
                                var foundIndex = graphData.findIndex(item => item.Geo === applogDataRaw[i].engineering_team);
                                if (foundIndex === -1) {
                                    var objNewEntry = {
                                        "Geo": applogDataRaw[i].engineering_team,
                                        "Revenue": 1
                                    };
                                    graphData.push(objNewEntry);
                                } else {
                                    graphData[foundIndex].Revenue = graphData[foundIndex].Revenue + 1;
                                }
                            }
                        }
                        var chartdatapie = graphData;
                        //var aTopEngTeamsData = this.getTopTeamData(chartdatapie, "Revenue", 5);
                        this.onGeoPie(chartdatapie);



                    }.bind(this),
                    error: function (oError) {

                    }.bind(this)
                });



                // OData Error Log

                // zutcf_sd_odata_error_log

                let oModel = this.getView().getModel("zutcf_sd_odata_error_log");
                let oBindList = oModel.bindList("/ZUTCF_Custom_Odata_Error_Log", null, null, aODataLogFilters);
                oBindList.requestContexts(0, 2000).then(function (aContexts) {
                    var aODataLogs = []
                    var aFrontendODataLogs = [];
                    var aBackendODataLogs = [];
                    for (var i = 0; i < aContexts.length; i++) {
                        aODataLogs.push(aContexts[i].getObject());
                    }
                        var oDataLogRaw = aODataLogs;
                        oDataLogRaw.forEach(function(item) {
                            if(item.bep_fnd == "B") {
                                aBackendODataLogs.push(item);
                            } else if(item.bep_fnd == "F") {
                                aFrontendODataLogs.push(item);
                            }
                          //  aStandardODataLog.push(this.getFilterObject("error_package", ))
                        })
                        var frontDatajsonOdataLog = new sap.ui.model.json.JSONModel({
                            items: []
                        });
                        this.getView().setModel(frontDatajsonOdataLog, "oFrontendDataLogData");
                        this.getView().getModel("oFrontendDataLogData").setData({
                            items: aFrontendODataLogs
                        });

                        var backDatajsonOdataLog = new sap.ui.model.json.JSONModel({
                            items: []
                        });
                        this.getView().setModel(backDatajsonOdataLog, "oBackendDataLogData");
                        this.getView().getModel("oBackendDataLogData").setData({
                            items: aBackendODataLogs
                        });

                        var sampleDatajsonOdataLog = new sap.ui.model.json.JSONModel({
                            items: []
                        });
                        this.getView().setModel(sampleDatajsonOdataLog, "oDataLogData");
                        this.getView().getModel("oDataLogData").setData({
                            items: oDataLogRaw
                        });

                        this.getView().byId("id_frontend").setCount(aFrontendODataLogs.length);  
                        this.getView().byId("id_backend").setCount(aBackendODataLogs.length);  

                        this.getView().byId("id_odata_error_logs").setCount(oDataLogRaw.length);    

                        // Prepare graph data for OData logs by team
                        var graphDataOData = [];
                        for (var i = 0; i < oDataLogRaw.length; i++) {
                            if (i === 0) {
                                var obj = {
                                    "Geo": oDataLogRaw[0].zteam,
                                    "Revenue": 1
                                };
                                graphDataOData.push(obj);
                            } else {
                                var foundIndex = graphDataOData.findIndex(item => item.Geo === oDataLogRaw[i].zteam);
                                if (foundIndex === -1) {
                                    var objNewEntry = {
                                        "Geo": oDataLogRaw[i].zteam,
                                        "Revenue": 1
                                    };
                                    graphDataOData.push(objNewEntry);
                                } else {
                                    graphDataOData[foundIndex].Revenue = graphDataOData[foundIndex].Revenue + 1;
                                }
                            }
                        }
                        var chartdataODataPie = graphDataOData;
                        //var aTopTeamODataLogs = this.getTopTeamData(chartdataODataPie, "Revenue", 5);
                        this.onODataPie(chartdataODataPie);


                }.bind(this));


                // IDOC Error Log

                // zutcf_sd_idoc_log

                let oIdocModel = this.getView().getModel("zutcf_sd_idoc_log");
                let oIdocBindList = oIdocModel.bindList("/zutcf_idoc_log_ce", null, null, aIdocLogFilters);

                oIdocBindList.requestContexts(0, 2000).then(function (aContexts) {
                    var aIdocLogs = []
                    for (var i = 0; i < aContexts.length; i++) {
                        aIdocLogs.push(aContexts[i].getObject());
                    }

                        var idocLogRaw = aIdocLogs;
                        var sampleDatajsonIdocLog = new sap.ui.model.json.JSONModel({
                            items: []
                        });
                        this.getView().setModel(sampleDatajsonIdocLog, "idocLogData");
                        this.getView().getModel("idocLogData").setData({
                            items: idocLogRaw
                        });

                        this.getView().byId("id_idoclogtab").setCount(idocLogRaw.length);  
                        
                        // Prepare graph data for OData logs by team
                        var graphDataIDoc = [];
                        for (var i = 0; i < idocLogRaw.length; i++) {
                            if (i === 0) {
                                var obj = {
                                    "Geo": idocLogRaw[0].zteam,
                                    "Revenue": 1
                                };
                                graphDataIDoc.push(obj);
                            } else {
                                var getIndex = graphDataIDoc.findIndex(item => item.Geo === idocLogRaw[i].zteam);
                                if (getIndex === -1) {
                                    var objNwEntry = {
                                        "Geo": idocLogRaw[i].zteam,
                                        "Revenue": 1
                                    };
                                    graphDataIDoc.push(objNwEntry);
                                } else {
                                    graphDataIDoc[getIndex].Revenue = graphDataIDoc[getIndex].Revenue + 1;
                                }
                            }
                        }
                        var chartdataIDocPie = graphDataIDoc;
                        //var aTopTeamIDocLogs = this.getTopTeamData(chartdataIDocPie, "Revenue", 5);
                        this.onIDocPie(chartdataIDocPie);


                }.bind(this));


                // SM13 System Log

                // zutcf_bsd_sm13_log_srv

                let oSm13Model = this.getView().getModel("zutcf_bsd_sm13_log_srv");
                let oSm13BindList = oSm13Model.bindList("/zutcf_sm13_log_ce", null, null, aODataLogFilters);

                oSm13BindList.requestContexts(0, 2000).then(function (aContexts) {
                    var aSm13Logs = []
                    for (var i = 0; i < aContexts.length; i++) {
                        aSm13Logs.push(aContexts[i].getObject());
                    }

                        var sm13LogRaw = aSm13Logs;
                        var sampleDatajsonSm13Log = new sap.ui.model.json.JSONModel({
                            items: []
                        });
                        this.getView().setModel(sampleDatajsonSm13Log, "sm13LogData");
                        this.getView().getModel("sm13LogData").setData({
                            items: sm13LogRaw
                        });

                        this.getView().byId("id_sm13logtab").setCount(sm13LogRaw.length);    

                        // Prepare graph data for SM13 logs by team
                        var graphDataSm13 = [];
                        for (var i = 0; i < sm13LogRaw.length; i++) {
                            if (i === 0) {
                                var obj = {
                                    "Geo": sm13LogRaw[0].zteam,
                                    "Revenue": 1
                                };
                                graphDataSm13.push(obj);
                            } else {
                                var foundIndex = graphDataSm13.findIndex(item => item.Geo === sm13LogRaw[i].zteam);
                                if (foundIndex === -1) {
                                    var objNewEntry = {
                                        "Geo": sm13LogRaw[i].zteam,
                                        "Revenue": 1
                                    };
                                    graphDataSm13.push(objNewEntry);
                                } else {
                                    graphDataSm13[foundIndex].Revenue = graphDataSm13[foundIndex].Revenue + 1;
                                }
                            }
                        }
                        var chartdataSm13Pie = graphDataSm13;
                        //var aTopsm13Data = this.getTopTeamData(chartdataSm13Pie, "Revenue", 5);
                        this.onSm13Pie(chartdataSm13Pie);


                }.bind(this));


                // ST22 dump data

                this.getOwnerComponent().getModel().read("/zutcf_custom_abap_dumps", {
                    filters: aFilters,
                    urlParameters: {
                        "$top": 2000,
                        "$orderby": "datum"
                    },
                    success: function (oData, oResponse) {

                        // this.getView().getModel("ZUTCF_BSB_APPL_LOG").read("/zutcf_application_log", {
                        //     filters: aAppLogFilters,
                        //     success: function (oData, oResponse) {

                        //     }.bind(this),
                        //     error: function (oError) {

                        //     }.bind(this)
                        // });
                        for (var i = 0; i < oData.results.length; i++) {
                            // oData.results[i].datum = oData.results[i].datum.toLocaleDateString();
                            oData.results[i].datum = oData.results[i].datum.substring(6, 8) + "/" + oData.results[i].datum.substring(4, 6) + "/" + oData.results[i].datum.substring(0, 4);
                            var h = Math.floor(oData.results[i].uzeit.ms / 1000 / 60 / 60);
                            var m = Math.floor((oData.results[i].uzeit.ms / 1000 / 60 / 60 - h) * 60);
                            var s = Math.floor(((oData.results[i].uzeit.ms / 1000 / 60 / 60 - h) * 60 - m) * 60);
                            oData.results[i].uzeit = h + ":" + m + ":" + s;
                        }

                        var chartdata = oData.results;

                        // chartdata.sort(function (a, b) {
                        //     return parseFloat(a.datum) - parseFloat(b.datum);
                        // });

                        tablefinaldata = [];
                        for (var q = 0; q < chartdata.length; q++) {
                            if (q === 0) {
                                var obj = {};
                                obj = chartdata[q];
                                tablefinaldata.push(obj);
                            } else {
                                var index = tablefinaldata.findIndex(object => object.datum === chartdata[q].datum &&
                                    object.uzeit === chartdata[q].uzeit &&
                                    object.cprog === chartdata[q].cprog);

                                if (index !== -1) {
                                    tablefinaldata[index].prog1 = tablefinaldata[index].prog1 + " , " + chartdata[q].prog1;
                                }
                                else {
                                    var obj = {};
                                    obj = chartdata[q];
                                    tablefinaldata.push(obj);
                                }
                            }
                        }

                        var chart1finaldata = [];
                        for (var i = 0; i < tablefinaldata.length; i++) {
                            if (i === 0) {

                                var customDump = 0;
                                var standardDump = 0;
                                if (tablefinaldata[i].cprog.charAt(0) === "Z" || tablefinaldata[i].cobjl.charAt(0) === "Z" ||
                                    tablefinaldata[i].prog1.charAt(0) === "Z" || tablefinaldata[i].prog2.charAt(0) === "Z") {
                                    customDump = parseInt(tablefinaldata[i].occnc);
                                } else {
                                    standardDump = parseInt(tablefinaldata[i].occnc);
                                }

                            } else {
                                if (tablefinaldata[i - 1].datum === tablefinaldata[i].datum) {
                                    if (tablefinaldata[i].cprog.charAt(0) === "Z" || tablefinaldata[i].cobjl.charAt(0) === "Z" ||
                                        tablefinaldata[i].prog1.charAt(0) === "Z" || tablefinaldata[i].prog2.charAt(0) === "Z") {
                                        customDump = customDump + parseInt(tablefinaldata[i].occnc);
                                    } else {
                                        standardDump = standardDump + parseInt(tablefinaldata[i].occnc);
                                    }

                                    if (i === (tablefinaldata.length - 1)) {
                                        var obj = {};
                                        obj.Date = tablefinaldata[i].datum;
                                        obj.cDump = standardDump;
                                        obj.sDump = customDump;
                                        chart1finaldata.push(obj);
                                    }
                                } else {
                                    var obj = {};
                                    obj.Date = tablefinaldata[i - 1].datum;
                                    obj.cDump = standardDump;
                                    obj.sDump = customDump;
                                    chart1finaldata.push(obj);
                                    customDump = 0; standardDump = 0;
                                    if (tablefinaldata[i].cprog.charAt(0) === "Z" || tablefinaldata[i].cobjl.charAt(0) === "Z" ||
                                        tablefinaldata[i].prog1.charAt(0) === "Z" || tablefinaldata[i].prog2.charAt(0) === "Z") {
                                        customDump = parseInt(tablefinaldata[i].occnc);
                                    } else {
                                        standardDump = parseInt(tablefinaldata[i].occnc);
                                    }

                                }
                            }
                        }

                        // for (var i = 0; i < tablefinaldata.length; i++) {
                        //     if (i === 0) {

                        //         var customDump = 0;
                        //         var standardDump = 0;
                        //         if (tablefinaldata[i].cprog.charAt(0) === "Z" || tablefinaldata[i].cobjl.charAt(0) === "Z" ||
                        //             tablefinaldata[i].prog1.charAt(0) === "Z" || tablefinaldata[i].prog2.charAt(0) === "Z") {
                        //             customDump = parseInt(tablefinaldata[i].occnc);
                        //         } else {
                        //             standardDump = parseInt(tablefinaldata[i].occnc);
                        //         }

                        //     } else {
                        //         if (tablefinaldata[i - 1].datum === tablefinaldata[i].datum) {
                        //             if (tablefinaldata[i].cprog.charAt(0) === "Z" || tablefinaldata[i].cobjl.charAt(0) === "Z" ||
                        //                 tablefinaldata[i].prog1.charAt(0) === "Z" || tablefinaldata[i].prog2.charAt(0) === "Z") {
                        //                 customDump = customDump + parseInt(tablefinaldata[i].occnc);
                        //             } else {
                        //                 standardDump = standardDump + parseInt(tablefinaldata[i].occnc);
                        //             }

                        //             if (i === (tablefinaldata.length - 1)) {
                        //                 var obj = {};
                        //                 obj.Date = tablefinaldata[i].datum;
                        //                 obj.cDump = standardDump;
                        //                 obj.sDump = customDump;
                        //                 chart1finaldata.push(obj);
                        //             }
                        //         } else {
                        //             var obj = {};
                        //             obj.Date = tablefinaldata[i - 1].datum;
                        //             obj.cDump = standardDump;
                        //             obj.sDump = customDump;
                        //             chart1finaldata.push(obj);
                        //             customDump = 0; standardDump = 0;
                        //             if (tablefinaldata[i].cprog.charAt(0) === "Z" || tablefinaldata[i].cobjl.charAt(0) === "Z" ||
                        //                 tablefinaldata[i].prog1.charAt(0) === "Z" || tablefinaldata[i].prog2.charAt(0) === "Z") {
                        //                 customDump = parseInt(tablefinaldata[i].occnc);
                        //             } else {
                        //                 standardDump = parseInt(tablefinaldata[i].occnc);
                        //             }

                        //         }
                        //     }
                        // }

                        // var chart1finaldata = [];
                        // for (var r = 0; r < tablefinaldata.length; r++) {
                        //     if (r === 0) {
                        //         var obj = {};
                        //         obj.Date = tablefinaldata[r].datum;
                        //         chart1finaldata.push(obj);
                        //     } else {
                        //         var index = chart1finaldata.findIndex(object => object.Date === tablefinaldata[r].datum);
                        //         if (index === -1) {
                        //             var obj = {};
                        //             obj.Date = tablefinaldata[r].datum;
                        //             chart1finaldata.push(obj);
                        //         }
                        //     }
                        // }



                        var sampleDatajson = new sap.ui.model.json.JSONModel({
                            items: []
                        });

                        var sampleDatajson3 = new sap.ui.model.json.JSONModel({
                            items: []
                        });

                        //Standard and Custom Bifurcation
                        var tablefinalStandard = [];
                        var tablefinalCustom = [];
                        for (var i = 0; i < tablefinaldata.length; i++) {
                            var lineData = {};
                            lineData = tablefinaldata[i];
                            if (lineData.cprogtyp === "CUSTOM") {
                                tablefinalCustom.push(lineData);
                            }
                            if (lineData.cprogtyp === "STANDARD") {
                                tablefinalStandard.push(lineData);
                            }
                        }

                        var countStandard = tablefinalStandard.length;
                        var countCustom = tablefinalCustom.length;

                        this.getView().byId("id_custom").setCount(countCustom);
                        this.getView().byId("id_standard").setCount(countStandard);
                        this.getView().byId("id_st22tab").setCount(countCustom + countStandard);

                        // this.getView().byId("id_odatalogtab").setCount("90");
                        // this.getView().byId("id_idoclogtab").setCount("45");
                        this.getView().byId("id_sm21logtab").setCount("67");
                        // this.getView().byId("id_sm13logtab").setCount("96");
                        

                        this.getView().setModel(sampleDatajson, "tabledata");
                        this.getView().getModel("tabledata").setData({
                            items: tablefinalStandard
                        });

                        this.getView().setModel(sampleDatajson3, "tabledataCustom");
                        this.getView().getModel("tabledataCustom").setData({
                            items: tablefinalCustom
                        });

                        this.onOST22Pie(tablefinalCustom);
                        var graphData = chart1finaldata;
                        
                        
                        // this.getView().byId("idStackedChartAmt").destroyDataset();
                        // this.getView().byId("idStackedChartAmt").removeAllFeeds();

                        // var sampleDatajson1 = new sap.ui.model.json.JSONModel({
                        //     items: []
                        // });
                        // this.getView().setModel(sampleDatajson1, "chartitem");
                        // this.getView().getModel("chartitem").setData({
                        //     items: graphData
                        // });


                        // var oVizFrame = this.getView().byId("idStackedChartAmt");
                        // oVizFrame.setVizProperties({
                        //     plotArea: {
                        //         // colorPalette: d3.scale.category20().range(),
                        //         colorPalette: ["#1D91D0", "#2AD0A9"],
                        //         dataLabel: {
                        //             showTotal: true,
                        //             visible: false
                        //         },
                        //         dataPointSize: { min: 40, max: 40 },
                        //     },
                        //     tooltip: {
                        //         visible: true
                        //     },
                        //     title: {
                        //         text: "Short Dump Trend for Selected Date Range"
                        //     },

                        // });

                        // var oDataset = new sap.viz.ui5.data.FlattenedDataset({

                        //     dimensions: [{
                        //         name: "Date",
                        //         value: "{chartitem>Date}"
                        //     }],

                        //     measures: [{
                        //         name: "Total Custom Dumps",
                        //         value: "{chartitem>sDump}"
                        //     }, {
                        //         name: "Total Standard Dumps",
                        //         value: "{chartitem>cDump}"
                        //     }],

                        //     data: {
                        //         path: "chartitem>/items"
                        //     }
                        // });
                        // oVizFrame.setDataset(oDataset);
                        // oVizFrame.setModel(sampleDatajson1, "chartitem");

                        // var oFeedValueAxis1 = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        //     "uid": "valueAxis",
                        //     "type": "Measure",
                        //     "values": ["Total Standard Dumps"]
                        // }),
                        //     oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        //         "uid": "valueAxis",
                        //         "type": "Measure",
                        //         "values": ["Total Custom Dumps"]
                        //     }),

                        //     oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        //         "uid": "categoryAxis",
                        //         "type": "Dimension",
                        //         "values": ["Date"]
                        //     });

                        // oVizFrame.addFeed(oFeedValueAxis);
                        // oVizFrame.addFeed(oFeedValueAxis1);
                        // oVizFrame.addFeed(oFeedCategoryAxis);



                        // for Second KPI


                        // var graphDataPie = [
                        //     {
                        //         "Type": "Standard Short Dump",
                        //         "Count": "78"
                        //     },
                        //     {
                        //         "Type": "Custom Short Dump",
                        //         "Count": "21"
                        //     }

                        // ];
                        // this.getView().byId("idStackedChartAmt2").destroyDataset();
                        // this.getView().byId("idStackedChartAmt2").removeAllFeeds();

                        // var sampleDatajson2 = new sap.ui.model.json.JSONModel({
                        //     items: []
                        // });
                        // this.getView().setModel(sampleDatajson2, "chartitempie");
                        // this.getView().getModel("chartitempie").setData({
                        //     items: graphDataPie
                        // });


                        // var oVizFramePie = this.getView().byId("idStackedChartAmt2");
                        // oVizFramePie.setModel(sampleDatajson2, "chartitempie");

                        // oVizFramePie.setVizProperties({
                        //     plotArea: {
                        //         // colorPalette: d3.scale.category20().range(),
                        //         // colorPalette: ["#d74e26", "#ffc21a"],
                        //         dataLabel: {
                        //             showTotal: true,
                        //             visible: true
                        //         },
                        //         // dataPointSize: { min: 40, max: 40 },
                        //     },
                        //     tooltip: {
                        //         visible: true
                        //     },
                        //     title: {
                        //         visible: true,
                        //         text: "Total Count of Standard and Custom Dumps",
                        //         align: "Center"
                        //     },

                        // });

                        // var oDatasetPie = new sap.viz.ui5.data.FlattenedDataset({

                        //     dimensions: [{
                        //         name: "TypeofShortDump",
                        //         value: "{chartitempie>Type}"
                        //     }],

                        //     measures: [{
                        //         name: "Count",
                        //         value: "{chartitempie>Count}"
                        //     }],

                        //     data: {
                        //         path: "chartitempie>/items"
                        //     }
                        // });
                        // oVizFramePie.setDataset(oDatasetPie);
                        // oVizFramePie.setModel(sampleDatajson2, "chartitempie");

                        // var oFeedValueAxis3 = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        //     "uid": "valueAxis3",
                        //     "type": "Measure",
                        //     "values": ["Count"]
                        // }),


                        //     oFeedCategoryAxis3 = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        //         "uid": "categoryAxis3",
                        //         "type": "Dimension",
                        //         "values": ["TypeofShortDump"]
                        //     });

                        // // oVizFrame.addFeed(oFeedValueAxis);
                        // oVizFramePie.addFeed(oFeedValueAxis3);
                        // oVizFramePie.addFeed(oFeedCategoryAxis3);

                        var totalcustomdump = 0, totalstandarddump = 0;
                        for (var t = 0; t < chart1finaldata.length; t++) {
                            totalcustomdump = totalcustomdump + chart1finaldata[t].sDump;
                            totalstandarddump = totalstandarddump + chart1finaldata[t].cDump;
                        }

                        // this.getView().byId("id_st22tab").setCount(totalcustomdump + totalstandarddump);

                        var chartdatapie = [{
                            "Geo": "Standard Short Dump",
                            "Revenue": totalstandarddump
                        },
                        {
                            "Geo": "Custom Short Dump",
                            "Revenue": totalcustomdump
                        },
                        ];



                        this.onGeo(chartdatapie);

                        BusyIndicator.hide();
                        
                    }.bind(this),
    
                    //error: function (oError) { }.bind(this)
                });


                //Busy Indicator Stop
                //var oView = this.getView();
                //oView.setBusy(false); // Show busy indicator
                // var oModel = this.getView().getModel();
                // var sQuery = oEvent.getParameter("busyIndicator"); 

            },

            onOST22Pie: function(oST22CustomData) {
                this.getView().byId("idStackedChartAmt").destroyDataset();
                this.getView().byId("idStackedChartAmt").removeAllFeeds();

                const occurNumwithTeam = oST22CustomData.map(obj => ({
                Revenue: `${obj.zteam}`,
                Count: `${obj.occnc}`
                }));

                const teamWithOccrCount = {};

                occurNumwithTeam.forEach(item => {
                const revenue = item.Revenue.trim();
                const count = parseInt(item.Count.trim(), 10);

                if (!teamWithOccrCount[revenue]) {
                    teamWithOccrCount[revenue] = 0;
                }
                teamWithOccrCount[revenue] += count;
                });
                const sumOfData = Object.keys(teamWithOccrCount).map(key => {
                    return { Revenue: key, Count: teamWithOccrCount[key] };
                });
                const data = sumOfData.findIndex(user => user.Revenue === "");
                    if (data !== -1) {
                    sumOfData.splice(data, 1);
                }
                var sampleDatajson = new sap.ui.model.json.JSONModel({
                    items: []
                });
                this.getView().setModel(sampleDatajson, "chartitemST22");
                this.getView().getModel("chartitemST22").setData({
                    items: sumOfData
                });

                var oVizFrame = this.getView().byId("idStackedChartAmt");
                oVizFrame.setModel(sampleDatajson, "chartitemST22");

                oVizFrame.setVizProperties({
                    plotArea: {

                        dataLabel: {
                            visible: false
                        },
                    },
                    tooltip: {
                        visible: true
                    },
                    title: {
                        visible: true,
                        text: "Custom Short Dump Trend for Selected Date Range",
                        align: "Center"
                    }
                });

                var oDataset = new sap.viz.ui5.data.FlattenedDataset({

                    dimensions: [{
                        name: "Team",
                        value: "{chartitemST22>Revenue}",
                        displayValue: "{path: '{chartitemST22>Revenue'} - {path: '{chartitemST22>Count'}"}],

                    measures: [{
                        name: "Count",
                        value: "{chartitemST22>Count}"
                    }],

                    data: {
                        path: "chartitemST22>/items"
                    }
                });

                oVizFrame.setDataset(oDataset);
                oVizFrame.setModel(sampleDatajson, "chartitemST22");

                var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                    "uid": "size",
                    "type": "Measure",
                    "values": ["Count"]
                }),

                    oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        "uid": "color",
                        "type": "Dimension",
                        "values": ["Team"]
                    });

                oVizFrame.addFeed(oFeedValueAxis);
                oVizFrame.addFeed(oFeedCategoryAxis);
            },

            getTopTeamData: function (arr, key, n) {
            if (!Array.isArray(arr) || arr.length === 0) {
                return [];
            }
            if (typeof key !== "string" || typeof n !== "number" || n <= 0) {
                throw new Error("Invalid arguments");
            }

            // Sort descending by key
            var sorted = arr.slice().sort(function (a, b) {
                var valA = Number(a[key]) || 0;
                var valB = Number(b[key]) || 0;
                return valB - valA;
            });
            return sorted.slice(0, n);
        },

            onODataPie: function (chartdatapie) {

                this.getView().byId("idODataPie").destroyDataset();
                this.getView().byId("idODataPie").removeAllFeeds();

                var sampleDatajson = new sap.ui.model.json.JSONModel({
                    items: []
                });
                this.getView().setModel(sampleDatajson, "chartitemOData");
                this.getView().getModel("chartitemOData").setData({
                    items: chartdatapie
                });

                var oVizFrame = this.getView().byId("idODataPie");
                oVizFrame.setModel(sampleDatajson, "chartitemOData");

                oVizFrame.setVizProperties({
                    plotArea: {

                        dataLabel: {
                            visible: false
                        },
                    },
                    tooltip: {
                        visible: true
                    },
                    title: {
                        visible: true,
                        text: "OData Error Logs by Engineering Team",
                        align: "Center"
                    }
                });

                var oDataset = new sap.viz.ui5.data.FlattenedDataset({

                    dimensions: [{
                        name: "Team",
                        value: "{chartitemOData>Geo}",
                        displayValue: "{path: '{chartitemOData>Geo'} - {path: '{chartitemOData>Revenue'}"}],

                    measures: [{
                        name: "Count",
                        value: "{chartitemOData>Revenue}"
                    }],

                    data: {
                        path: "chartitemOData>/items"
                    }
                });

                oVizFrame.setDataset(oDataset);
                oVizFrame.setModel(sampleDatajson, "chartitemOData");

                var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                    "uid": "size",
                    "type": "Measure",
                    "values": ["Count"]
                }),

                    oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        "uid": "color",
                        "type": "Dimension",
                        "values": ["Team"]
                    });

                oVizFrame.addFeed(oFeedValueAxis);
                oVizFrame.addFeed(oFeedCategoryAxis);

            },

            onSm13Pie: function (chartdatapie) {

                this.getView().byId("idSm13Pie").destroyDataset();
                this.getView().byId("idSm13Pie").removeAllFeeds();

                var sampleDatajson = new sap.ui.model.json.JSONModel({
                    items: []
                });
                this.getView().setModel(sampleDatajson, "chartitemSm13");
                this.getView().getModel("chartitemSm13").setData({
                    items: chartdatapie
                });

                var oVizFrame = this.getView().byId("idSm13Pie");
                oVizFrame.setModel(sampleDatajson, "chartitemSm13");

                oVizFrame.setVizProperties({
                    plotArea: {

                        dataLabel: {
                            visible: false
                        },
                    },
                    tooltip: {
                        visible: true
                    },
                    title: {
                        visible: true,
                        text: "SM13 System Logs by Engineering Team",
                        align: "Center"
                    }
                });

                var oDataset = new sap.viz.ui5.data.FlattenedDataset({

                    dimensions: [{
                        name: "Team",
                        value: "{chartitemSm13>Geo}",
                        displayValue: "{path: '{chartitemSm13>Geo'} - {path: '{chartitemSm13>Revenue'}",
                    }],

                    measures: [{
                        name: "Count",
                        value: "{chartitemSm13>Revenue}"
                    }],

                    data: {
                        path: "chartitemSm13>/items"
                    }
                });

                oVizFrame.setDataset(oDataset);
                oVizFrame.setModel(sampleDatajson, "chartitemSm13");

                var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                    "uid": "size",
                    "type": "Measure",
                    "values": ["Count"]
                }),

                    oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        "uid": "color",
                        "type": "Dimension",
                        "values": ["Team"]
                    });

                oVizFrame.addFeed(oFeedValueAxis);
                oVizFrame.addFeed(oFeedCategoryAxis);

            },

            onGeoPie: function (chartdatapie) {

                // var standardDumpPercent = ((chartdatapie[0].Revenue * 100) / (chartdatapie[0].Revenue + chartdatapie[1].Revenue)).toString().substring(0, 5)
                // var customDumpPercent = ((chartdatapie[1].Revenue * 100) / (chartdatapie[0].Revenue + chartdatapie[1].Revenue)).toString().substring(0, 5)
                // var finaltext = "Custom Short Dump Percentage - " + customDumpPercent + "% , Standard Short Dump Percentage - " + standardDumpPercent + "%";
                // this.getView().byId("percentLabel").setText(finaltext);

                this.getView().byId("idGeopie").destroyDataset();
                this.getView().byId("idGeopie").removeAllFeeds();




                var sampleDatajson = new sap.ui.model.json.JSONModel({
                    items: []
                });
                this.getView().setModel(sampleDatajson, "chartitem");
                this.getView().getModel("chartitem").setData({
                    items: chartdatapie
                });

                var oVizFrame = this.getView().byId("idGeopie");
                oVizFrame.setModel(sampleDatajson, "chartitem");

                oVizFrame.setVizProperties({
                    plotArea: {

                        dataLabel: {
                            visible: false
                        },
                    },
                    tooltip: {
                        visible: true
                    },
                    title: {
                        visible: true,
                        text: "Application Logs by Engineering Team",
                        align: "Center"
                    }
                });

                var oDataset = new sap.viz.ui5.data.FlattenedDataset({

                    dimensions: [{
                        name: "Short Dump Type",
                        value: "{chartitem>Geo}",
                        displayValue: "{path: '{chartitem>Geo'} - {path: '{chartitem>Revenue'}",
                    }],

                    measures: [{
                        name: "Count",
                        value: "{chartitem>Revenue}"
                    }],

                    data: {
                        path: "chartitem>/items"
                    }
                });

                oVizFrame.setDataset(oDataset);
                oVizFrame.setModel(sampleDatajson, "chartitem");

                var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                    "uid": "size",
                    "type": "Measure",
                    "values": ["Count"]
                }),

                    oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        "uid": "color",
                        "type": "Dimension",
                        "values": ["Short Dump Type"]
                    });

                oVizFrame.addFeed(oFeedValueAxis);
                oVizFrame.addFeed(oFeedCategoryAxis);

            },
            onIDocPie: function (chartdatapie) {

                this.getView().byId("idIdocPie").destroyDataset();
                this.getView().byId("idIdocPie").removeAllFeeds();

                var sampleDatajson = new sap.ui.model.json.JSONModel({
                    items: []
                });
                this.getView().setModel(sampleDatajson, "chartitemIDoc");
                this.getView().getModel("chartitemIDoc").setData({
                    items: chartdatapie
                });

                var oVizFrame = this.getView().byId("idIdocPie");
                oVizFrame.setModel(sampleDatajson, "chartitemIDoc");

                oVizFrame.setVizProperties({
                    plotArea: {

                        dataLabel: {
                            visible: false
                        },
                    },
                    tooltip: {
                        visible: true
                    },
                    title: {
                        visible: true,
                        text: "IDoc Logs by Engineering Team",
                        align: "Center"
                    }
                });

                var oDataset = new sap.viz.ui5.data.FlattenedDataset({

                    dimensions: [{
                        name: "Team",
                        value: "{chartitemIDoc>Geo}",
                        displayValue: "{path: '{chartitemIDoc>Geo'} - {path: '{chartitemIDoc>Revenue'}",
                    }],

                    measures: [{
                        name: "Count",
                        value: "{chartitemIDoc>Revenue}"
                    }],

                    data: {
                        path: "chartitemIDoc>/items"
                    }
                });

                oVizFrame.setDataset(oDataset);
                oVizFrame.setModel(sampleDatajson, "chartitemIDoc");

                var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                    "uid": "size",
                    "type": "Measure",
                    "values": ["Count"]
                }),

                    oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                        "uid": "color",
                        "type": "Dimension",
                        "values": ["Team"]
                    });

                oVizFrame.addFeed(oFeedValueAxis);
                oVizFrame.addFeed(oFeedCategoryAxis);

            },


            onGeo: function (chartdatapie) {
             
                var standardDumpPercent = Math.round(((chartdatapie[0].Revenue * 100) / (chartdatapie[0].Revenue + chartdatapie[1].Revenue)).toString().substring(0, 5));
                var customDumpPercent = Math.round(((chartdatapie[1].Revenue * 100) / (chartdatapie[0].Revenue + chartdatapie[1].Revenue)).toString().substring(0, 5));
                var finaltext = "Custom Short Dump Percentage - " + customDumpPercent + "% , Standard Short Dump Percentage - " + standardDumpPercent + "%";
                this.getView().byId("percentLabel").setText(finaltext);



                // this.getView().byId("idGeopie").destroyDataset();
                // this.getView().byId("idGeopie").removeAllFeeds();




                // var sampleDatajson = new sap.ui.model.json.JSONModel({
                //     items: []
                // });
                // this.getView().setModel(sampleDatajson, "chartitem");
                // this.getView().getModel("chartitem").setData({
                //     items: chartdatapie
                // });

                // var oVizFrame = this.getView().byId("idGeopie");
                // oVizFrame.setModel(sampleDatajson, "chartitem");

                // oVizFrame.setVizProperties({
                //     plotArea: {

                //         dataLabel: {
                //             visible: true
                //         },
                //     },
                //     tooltip: {
                //         visible: true
                //     },
                //     title: {
                //         visible: true,
                //         text: "Percentage of Short Dumps by Type",
                //         align: "Center"
                //     }
                // });

                // var oDataset = new sap.viz.ui5.data.FlattenedDataset({

                //     dimensions: [{
                //         name: "Short Dump Type",
                //         value: "{chartitem>Geo}"
                //     }],

                //     measures: [{
                //         name: "Count",
                //         value: "{chartitem>Revenue}"
                //     }],

                //     data: {
                //         path: "chartitem>/items"
                //     }
                // });

                // oVizFrame.setDataset(oDataset);
                // oVizFrame.setModel(sampleDatajson, "chartitem");

                // var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                //     "uid": "size",
                //     "type": "Measure",
                //     "values": ["Count"]
                // }),

                //     oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
                //         "uid": "color",
                //         "type": "Dimension",
                //         "values": ["Short Dump Type"]
                //     });

                // oVizFrame.addFeed(oFeedValueAxis);
                // oVizFrame.addFeed(oFeedCategoryAxis);

            },

            onExport: function () {
                let csv = '';
                let headers = Object.keys(tablefinaldata[0]);
                csv += headers.join(',') + '\n';

                tablefinaldata.forEach(function (row) {
                    let data = headers.map(header => JSON.stringify(row[header])).join(','); // Add JSON.stringify statement
                    csv += data + '\n';
                });

                let blob = new Blob([csv], { type: 'text/csv' });
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = 'export.csv';
                document.body.appendChild(a);
                a.click();

            }


        });
    });
