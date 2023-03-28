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

--Checks for individual medals in team events
SELECT * from event join medal on medal.event_id = event.id where event.name = '4X200M Freestyle';

--Changing duplicates disciplines with different names
SELECT distinct discipline from event;

SELECT * from event where discipline in ('Wrestling Freestyle', 'Wrestling Free.');
UPDATE event SET discipline = 'Wrestling Freestyle' WHERE discipline = 'Wrestling Free.';

SELECT * from event where discipline ilike ('Water polo');
UPDATE event set discipline = 'Water Polo' where discipline ilike ('Water polo');

SELECT * from event where discipline in ('Artistic G.','Gymnastics Artistic');
UPDATE event set discipline = 'Gymnastics Artistic' where discipline = 'Artistic G.';

SELECT * from event where discipline in ('Rhythmic G.','Gymnastics Rhythmic');
UPDATE event set discipline = 'Gymnastics Rhythmic' WHERE discipline = 'Rhythmic G.';

SELECT * from event where discipline in ('Synchronized Swimming','Synchronized S.');
UPDATE event set discipline = 'Synchronized Swimming' where discipline = 'Synchronized S.';

SELECT * from event where discipline in ('Canoe Sprint','Canoe / Kayak F');
UPDATE event set discipline = 'Canoe Sprint' where discipline = 'Canoe / Kayak F';

SELECT * from event where discipline in ('Canoe Slalom', 'Canoe / Kayak S');
UPDATE event set discipline = 'Canoe Slalom' where discipline = 'Canoe / Kayak S';

SELECT * from event where discipline in ('Modern Pentathlon','Modern Pentath.');
UPDATE event set discipline = 'Modern Pentathlon' where discipline = 'Modern Pentath.';

--Multipart to singlepart "countries" table to get proper centroids
CREATE table singlepart_countries as
SELECT id, name, code, pop, first_participation, last_participation, (ST_Dump(geometry)).geom from country;

alter table singlepart_countries add column surf float;
update singlepart_countries set surf = ST_AREA(geom);

--Creating a table with all the biggest parts of all the countries except Denmark and Indonesia.
drop table if exists biggest_singlepart;
create table biggest_singlepart as
with foo as (
select id, name, max(surf) as surf
from singlepart_countries
group by id, name)
select foo.id as id,
       foo.name as name,
       s_c.first_participation as first_participation,
       s_c.last_participation as last_participation,
       s_c.geom as geom,
       s_c.surf as surf ,
       s_c.pop as pop
from foo, singlepart_countries as s_c
where foo.surf = s_c.surf and foo.name not in ('Denmark', 'Indonesia');

--Adding Indonesia in our "biggest_singlepart" table with all its parts
insert into biggest_singlepart (id, name, first_participation, last_participation, geom, pop)
values ((SELECT id from country where name = 'Indonesia'),
(SELECT name from country where name = 'Indonesia'),
(SELECT first_participation from country where name = 'Indonesia'),
(SELECT last_participation from country where name = 'Indonesia'),
(SELECT geometry from country where name = 'Indonesia'),
(SELECT pop from country where name = 'Indonesia'));

--deleting Groenland from "singlepart_countries"
with biggest_part as (
select id, name, max(surf) as surf
from singlepart_countries
group by id, name),
groenland as(
select biggest_part.id as id,
       biggest_part.name as name,
       s_c.first_participation as first_participation,
       s_c.last_participation as last_participation,
       s_c.geom as geom,
       s_c.surf as surf ,
       s_c.pop as pop
from biggest_part, singlepart_countries as s_c
where biggest_part.surf = s_c.surf and biggest_part.name = 'Denmark')
delete from singlepart_countries where (select groenland.geom from groenland) = singlepart_countries.geom;

--Adding Denmark to "biggest_singlepart"
with foo as (
select id, name, max(surf) as surf
from singlepart_countries
group by id, name)
INSERT INTO biggest_singlepart (id, name, first_participation, last_participation, geom, surf, pop)
       VALUES ((SELECT foo.id FROM foo, singlepart_countries as s_c where foo.surf = s_c.surf and foo.name = 'Denmark'),
               (SELECT foo.name FROM foo, singlepart_countries as s_c where foo.surf = s_c.surf and foo.name = 'Denmark'),
               (SELECT s_c.first_participation FROM foo, singlepart_countries as s_c where foo.surf = s_c.surf and foo.name = 'Denmark'),
               (SELECT s_c.last_participation FROM foo, singlepart_countries as s_c where foo.surf = s_c.surf and foo.name = 'Denmark'),
               (SELECT s_c.geom FROM foo, singlepart_countries as s_c where foo.surf = s_c.surf and foo.name = 'Denmark'),
               (SELECT s_c.surf FROM foo, singlepart_countries as s_c where foo.surf = s_c.surf and foo.name = 'Denmark'),
               (SELECT s_c.pop FROM foo, singlepart_countries as s_c where foo.surf = s_c.surf and foo.name = 'Denmark'));

alter table biggest_singlepart add column centroid geometry;
update biggest_singlepart set centroid = st_centroid(geom);
--Creating a table with only centroids
CREATE TABLE centroids AS (SELECT id, name, first_participation, last_participation, centroid as geom, pop FROM biggest_singlepart);

-- testing queries
SELECT country.name, count(medal.medal) AS medalcount
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
JOIN event ON medal.event_id = event.id
JOIN country ON athlete.country_id = country.id
GROUP BY country.name
ORDER BY medalcount desc;

SELECT country.name, count(medal.medal) AS medalcount, olympiad.year
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
JOIN event ON medal.event_id = event.id
JOIN country ON athlete.country_id = country.id
JOIN olympiad on medal.olympiad_id = olympiad.id
WHERE olympiad.year = 2008
GROUP BY country.name, olympiad.year
ORDER BY medalcount desc;

SELECT athlete.name, country.name as nationality, count(medal.medal) AS medalcount, event.discipline FROM athlete JOIN medal ON athlete.id = medal.athlete_id JOIN event ON medal.event_id = event.id JOIN country ON athlete.country_id = country.id WHERE event.discipline = 'Swimming' AND country.name = 'France' GROUP BY event.discipline, athlete.name, nationality ORDER BY medalcount desc limit 20;

SELECT athlete.name,
       count(medal.medal) AS medalcount
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
GROUP BY athlete.name
ORDER BY medalcount desc limit 20;

SELECT athlete.name,
       country.name as nationality,
       count(medal.medal) AS medalcount
FROM athlete
JOIN medal ON athlete.id = medal.athlete_id
JOIN event ON medal.event_id = event.id
JOIN country ON athlete.country_id = country.id
WHERE country.name = 'France'
GROUP BY athlete.name, nationality
ORDER BY medalcount desc limit 20;


SELECT athlete.name,
       count(medal.medal) AS medalcount
FROM athlete JOIN medal ON athlete.id = medal.athlete_id
GROUP by athlete.name
ORDER BY medalcount DESC LIMIT 20;

SELECT athlete.name, count(medal.medal) as medalcount, country.name, olympiad.year
FROM athlete JOIN medal ON athlete.id = medal.athlete_id
JOIN country on athlete.country_id = country.id
JOIN olympiad on medal.olympiad_id = olympiad.id
WHERE athlete.name ilike 'APANASSENKO, Dmitri'
GROUP BY athlete.name, country.name, olympiad.year;

--selects all the athletes that have been part of olympics under two different flags
with athlete1 as (select * from athlete)
select athlete1.*, athlete.country_id as country2
from athlete1, athlete where athlete1.name = athlete.name
                         and athlete1.country_id != athlete.country_id;