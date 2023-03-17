CREATE view best_discipline_by_country AS
    WITH tab AS (SELECT country.name, count(medal.medal) AS medalcount, event.discipline
    FROM athlete
        JOIN medal on athlete.id=medal.athlete_id
        JOIN event on medal.event_id = event.id
        JOIN country ON athlete.country_id = country.id
    GROUP BY country.id, event.discipline),
    tab2 AS (SELECT max(tab.medalcount), name FROM tab GROUP BY name)
SELECT tab.name, tab.medalcount, tab.discipline FROM tab, tab2 WHERE tab2.max = tab.medalcount AND tab.name = tab2.name;