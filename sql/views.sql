--Best discipline by country
CREATE VIEW best_discipline_by_country AS
    WITH tab AS (SELECT country.name, count(medal.medal) AS medalcount, event.discipline
    FROM athlete
        JOIN medal on athlete.id=medal.athlete_id
        JOIN event on medal.event_id = event.id
        JOIN country ON athlete.country_id = country.id
    GROUP BY country.id, event.discipline),
    tab2 AS (SELECT max(tab.medalcount), name FROM tab GROUP BY name)
SELECT tab.name, tab.medalcount, tab.discipline FROM tab, tab2 WHERE tab2.max = tab.medalcount AND tab.name = tab2.name;

--Get the 20 best countries in a discipline
SELECT country.name, count(medal.medal) AS medalcount, event.discipline
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
JOIN event ON medal.event_id = event.id
JOIN country ON athlete.country_id = country.id
WHERE event.discipline = 'Swimming'
GROUP BY event.discipline, country.name
ORDER BY medalcount desc limit 20;

--Get the 20 best athletes of a country in a discipline (
SELECT athlete.name, country.name as nationality, count(medal.medal) AS medalcount, event.discipline
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
JOIN event ON medal.event_id = event.id
JOIN country ON athlete.country_id = country.id
WHERE event.discipline = 'Swimming' AND country.name = 'Australia'
GROUP BY event.discipline, country.name, athlete.name
ORDER BY medalcount desc limit 20;

--Get the 20 best athletes of a discipline in the world (change the WHERE clause)
SELECT athlete.name, country.name as nationality, count(medal.medal) AS medalcount, event.discipline
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
JOIN event ON medal.event_id = event.id
JOIN country ON athlete.country_id = country.id
WHERE event.discipline = 'Swimming'
GROUP BY event.discipline, country.name, athlete.name
ORDER BY medalcount desc limit 20;

--Get all the discipline with no duplicate value
SELECT distinct discipline from event;

SELECT country.name, count(medal.medal) AS medalcount, event.discipline, olympiad.year
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
JOIN event ON medal.event_id = event.id
JOIN country ON athlete.country_id = country.id
JOIN olympiad ON medal.olympiad_id = olympiad.id
WHERE event.discipline = 'Swimming' AND olympiad.year = '2012'
GROUP BY event.discipline, country.name, olympiad.year
ORDER BY medalcount desc;

--SELECT * from event join medal on medal.event_id = event.id where event.name = '4X200M Freestyle';