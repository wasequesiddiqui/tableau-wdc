(function() {
    var myConnector = tableau.makeConnector();

    // Dynamically define schema from CSV headers
    myConnector.getSchema = function(schemaCallback) {
        var url = "https://docs.google.com/spreadsheets/d/1SNOSU6QlB0pbR-cLPy2r2d4iiIMSzRsseatuZqLl6co/gviz/tq?tqx=out:csv";

        fetch(url)
            .then(response => response.text())
            .then(csvText => {
                var rows = csvText.split("\n").map(r => r.split(","));
                var headers = rows[0]; // first row = column names

                // Build schema dynamically
                var cols = headers.map(h => ({
                    id: h.trim(),
                    alias: h.trim(),
                    dataType: tableau.dataTypeEnum.string // default to string
                }));

                var tableSchema = {
                    id: "googleSheetData",
                    alias: "Google Sheet CSV Data",
                    columns: cols
                };

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
                            obj[h.trim()] = row[idx];
                        });
                        tableData.push(obj);
                    }
                }

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
