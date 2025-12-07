(function() {
    var myConnector = tableau.makeConnector();

    // Dynamically define schema with type detection + sanitization
    myConnector.getSchema = function(schemaCallback) {
        var url = "https://docs.google.com/spreadsheets/d/1SNOSU6QlB0pbR-cLPy2r2d4iiIMSzRsseatuZqLl6co/gviz/tq?tqx=out:csv";

        fetch(url)
            .then(response => response.text())
            .then(csvText => {
                var rows = csvText.split("\n").map(r => r.split(","));
                var headers = rows[0];
                var sampleRows = rows.slice(1, 20); // use first 20 rows to guess types

                var cols = headers.map((h, idx) => {
                    // Sanitize header for Tableau ID
                    let cleanId = h.trim().replace(/[^a-zA-Z0-9_]/g, "_");

                    // Detect numeric type
                    let isNumeric = true;
                    for (let r of sampleRows) {
                        if (r[idx] && isNaN(r[idx])) {
                            isNumeric = false;
                            break;
                        }
                    }

                    return {
                        id: cleanId,
                        alias: h.trim(), // original header for display
                        dataType: isNumeric ? tableau.dataTypeEnum.float : tableau.dataTypeEnum.string
                    };
                });

                var tableSchema = {
                    id: "googleSheetData",
                    alias: "Google Sheet CSV Data",
                    columns: cols
                };

                console.log("Schema IDs:", cols.map(c => c.id)); // debug
                schemaCallback([tableSchema]);
            })
            .catch(error => {
                console.error("Error fetching schema:", error);
                schemaCallback([]);
            });
    };

    // Fetch and parse CSV data
    myConnector.getData = function(table, doneCallback) {
        var url = "https://docs.google.com/spreadsheets/d/1SNOSU6QlB0pbR-cLPy2r2d4iiIMSzRsseatuZqLl6co/gviz/tq?tqx=out:csv";

        fetch(url)
            .then(response => response.text())
            .then(csvText => {
                var rows = csvText.split("\n").map(r => r.split(","));
                var headers = rows[0];
                var tableData = [];

                for (var i = 1; i < rows.length; i++) {
                    var row = rows[i];
                    if (row.length === headers.length) {
                        var obj = {};
                        headers.forEach((h, idx) => {
                            let cleanId = h.trim().replace(/[^a-zA-Z0-9_]/g, "_");
                            let val = row[idx].trim();
                            obj[cleanId] = val === "" ? null : (isNaN(val) ? val : parseFloat(val));
                        });
                        tableData.push(obj);
                    }
                }

                console.log("Sample row:", tableData[0]); // debug
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
