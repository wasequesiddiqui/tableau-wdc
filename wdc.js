(function() {
    var myConnector = tableau.makeConnector();

    // List of allowed columns
    const allowedCols = ["Student Name", "Date Formatted", "Decimal Time"];

    myConnector.getSchema = function(schemaCallback) {
        var url = "https://docs.google.com/spreadsheets/d/1SNOSU6QlB0pbR-cLPy2r2d4iiIMSzRsseatuZqLl6co/gviz/tq?tqx=out:csv";

        fetch(url)
            .then(response => response.text())
            .then(csvText => {
                csvText = csvText.replace(/^\uFEFF/, ""); // strip BOM
                var rows = csvText.split("\n").map(r => r.split(","));
                var headers = rows[0];
                var sampleRows = rows.slice(1, 20);

                var cols = headers.map((h, idx) => {
                    let rawHeader = h.trim().replace(/^"|"$/g, "");
                    if (!allowedCols.includes(rawHeader)) return null; // skip if not allowed

                    let cleanId = rawHeader.replace(/[^a-zA-Z0-9_]/g, "_");

                    // Detect numeric type
                    let isNumeric = true;
                    for (let r of sampleRows) {
                        if (r[idx]) {
                            let val = r[idx].trim().replace(/^"|"$/g, "");
                            if (val !== "" && isNaN(val)) {
                                isNumeric = false;
                                break;
                            }
                        }
                    }

                    return {
                        id: cleanId,
                        alias: rawHeader,
                        dataType: isNumeric ? tableau.dataTypeEnum.float : tableau.dataTypeEnum.string
                    };
                }).filter(c => c !== null);

                console.log("Schema IDs:", cols.map(c => c.id));
                schemaCallback([{
                    id: "googleSheetData",
                    alias: "Google Sheet CSV Data",
                    columns: cols
                }]);
            })
            .catch(error => {
                console.error("Error fetching schema:", error);
                schemaCallback([]);
            });
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

                for (var i = 1; i < rows.length; i++) {
                    var row = rows[i];
                    if (row.length === headers.length) {
                        var obj = {};
                        headers.forEach((h, idx) => {
                            let rawHeader = h.trim().replace(/^"|"$/g, "");
                            if (!allowedCols.includes(rawHeader)) return; // skip if not allowed

                            let cleanId = rawHeader.replace(/[^a-zA-Z0-9_]/g, "_");
                            let val = row[idx].trim().replace(/^"|"$/g, "");
                            obj[cleanId] = val === "" ? null : (isNaN(val) ? val : parseFloat(val));
                        });
                        tableData.push(obj);
                    }
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
