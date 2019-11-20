
d3.csv("bar_chart_migration_saldo.csv")
    .then((data) => {
        return data.map((d) => {
            d.Year = +d.Year;
            d.Amsterdam = d.Amsterdam;
            console.log(d)
            console.log(d.Amsterdam)

            return d;
        });

    })
    .catch((error) => {
    		throw error;
    });
