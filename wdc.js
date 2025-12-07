(function() {
    var myConnector = tableau.makeConnector();

    myConnector.getSchema = function(schemaCallback) {
        var cols = [
            { id: "Student_Name", alias: "Student Name", dataType: tableau.dataTypeEnum.string },
            { id: "Date_Formatted", alias: "Date Formatted", dataType: tableau.dataTypeEnum.string },
            { id: "Decimal_Time", alias: "Decimal Time", dataType: tableau.dataTypeEnum.float }
        ];

        schemaCallback([{
            id: "googleSheetData",
            alias: "Google Sheet CSV Data",
            columns: cols
        }]);
    };

    myConnector.getData = function(table, doneCallback) {
        var url = "https://docs.google.com/spreadsheets/d/1SNOSU6QlB0pbR-cLPy2r2d4iiIMSzRsseatuZqLl6co/gviz/tq?tqx=out:csv";

        fetch(url)
            .then(response => response.text())
            .then(csvText => {
                csvText = csvText.replace(/^\uFEFF/, "");
                var rows = csvText.split("\n").map(r => r.split(","));
                var headers = rows[0];
                var tableData = [];

                // Map header indices for the allowed columns
                var idxMap = {};
                headers.forEach((h, i) => {
                    let raw = h.trim().replace(/^"|"$/g, "");
                    if (raw === "Student Name") idxMap.Student_Name = i;
                    if (raw === "Date Formatted") idxMap.Date_Formatted = i;
                    if (raw === "Decimal Time") idxMap.Decimal_Time = i;
                });

                for (var i = 1; i < rows.length; i++) {
                    var row = rows[i];
                    var obj = {};
                    if (idxMap.Student_Name !== undefined) {
                        obj.Student_Name = row[idxMap.Student_Name].trim().replace(/^"|"$/g, "");
                    }
                    if (idxMap.Date_Formatted !== undefined) {
                        obj.Date_Formatted = row[idxMap.Date_Formatted].trim().replace(/^"|"$/g, "");
                    }
                    if (idxMap.Decimal_Time !== undefined) {
                        let val = row[idxMap.Decimal_Time].trim().replace(/^"|"$/g, "");
                        obj.Decimal_Time = val === "" ? null : parseFloat(val);
                    }
                    tableData.push(obj);
                }

                console.log("Sample row:", tableData[0]);
                table.appendRows(tableData);
                doneCallback();
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                doneCallback();
            });
    };

    tableau.registerConnector(myConnector);

    document.addEventListener("DOMContentLoaded", function() {
        document.getElementById("submitButton").addEventListener("click", function() {
            tableau.connectionName = "Google Sheet Connector";
            tableau.submit();
        });
    });
})();
