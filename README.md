Ce dépôt rassemble le code d'un projet universitaire de web mapping.  
Si vous voulez reproduire et visualiser le site web en local :  

__Pré-requis : Node.js, Geoserver, PostgreSQL avec l'extension PostGIS et votre client postgres préféré.__

1- Télécharger et dézipper le dépôt.  
  
2- Sur le client Postgres : Créer (un serveur et) une base de données qu'on nommera "__olympics__".  
Éxécuter les scripts sql/*olympics.schema.sql* sql/*olympics.data.sql*, sql/*create_olympic_cities.sql*, sql/*update_olympiad.sql*, sql/*views_queries.sql* __dans cet ordre__.  
  
3- Dans le geoserveur : créer un espace de travail "olympics" puis y ajouter un entrepôt (lui donner même nom), en se connectant à la base de données (étape 2).  
Publier les couches "*olympic_cities*", "*country*", "*centroids*" de l'entrepôt.  

4- Ajouter un fichier texte nommé ".env" dans carto_web/web/ et y renseigner ses paramètres de connexion à la base de données postgres comme cela :  
DB_USER=*identifiant*  
DB_PASS="*mot_de_passe*" __(entre double quotes)__  
DB_HOST=__localhost__  
DB_DATABASE_NAME=__olympics__  
DB_PORT=*port* __(5432 par défaut)__  
  
5- Lancer une invite de commande et se placer sur le dépôt, puis dans web  
Exécuter les commandes "__npm install__" et "__npm start__" __dans cet ordre__.  

6- Allez sur [localhost:3000](localhost:3000)  
  
7- Contemplez notre site  
