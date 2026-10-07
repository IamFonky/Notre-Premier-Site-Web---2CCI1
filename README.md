# Atlas du monde

Petit atlas interactif réalisé en HTML et CSS. Cliquez sur un pays coloré de la carte pour découvrir sa fiche. Le site est statique : aucun outil de compilation n’est nécessaire.

## Lancer le projet

Clonez le dépôt, puis ouvrez `index.html` dans un navigateur. Vous pouvez aussi utiliser une extension de serveur local, par exemple Live Server dans VS Code.

## Ajouter un pays

1. Ouvrez une issue sur GitHub, par exemple **Ajouter le Japon**. Indiquez le nom du pays et les informations que vous souhaitez présenter.
2. Clonez le projet et créez une branche liée à l’issue :

   ```sh
   git clone https://github.com/IamFonky/Notre-Premier-Site-Web---2CCI1.git
   cd Notre-Premier-Site-Web---2CCI1
   git switch -c ajout-japon
   ```

3. Créez vous-même une nouvelle page HTML pour le pays dans `countries/` (par exemple `countries/japan.html`) et concevez sa fiche.
4. Dans `index.html`, ajoutez un lien vers la page HTML dans la liste « Available countries », par exemple :

   ```html
   <li><a href="countries/japan.html">Japon</a></li>
   ```

5. Dans `assets/world-map.svg`, reliez le pays à sa page et faites-le ressortir sur la carte :
   - Repérez son élément `<path>` dans le SVG. Son `id` et sa classe utilisent généralement le code pays à deux lettres en minuscules (par exemple `jp` pour le Japon). Gardez le tracé existant et son attribut `d`.
   - Entourez le `<path>` d’un lien vers la page créée à l’étape 3. Comme le SVG se trouve dans `assets/`, le chemin commence par `../countries/` :

     ```svg
     <a href="../countries/japan.html" aria-label="Découvrir le Japon" tabindex="0">
       <path id="jp" class="landxx jp" d="...">
     </a>
     ```

   - Dans le bloc `<style>` du SVG, ajoutez une règle pour la classe du pays afin de lui donner une couleur et un curseur cliquable. Ajoutez aussi un style `:hover` et `:focus` pour que le changement soit visible au survol et au clavier. Par exemple, utilisez `.jp`, `.jp:hover` et `.jp:focus` pour le Japon.
6. Ouvrez `index.html` et vérifiez le lien de la liste et le clic sur la carte.
7. Avant de publier vos changements, récupérez les dernières modifications et fusionnez `origin/main` dans votre branche :

   ```sh
   git fetch --all
   git merge origin/main
   ```

   Si des conflits apparaissent, résolvez-les puis vérifiez à nouveau le site.
8. Ajoutez vos fichiers, créez un commit, puis poussez votre branche (remplacez `ajout-japon` par le nom de votre branche) :

   ```sh
   git add countries/japan.html index.html assets/world-map.svg
   git commit -m "Ajoute la fiche du Japon"
   git push -u origin ajout-japon
   ```

   Enfin, ouvrez une pull request vers `main` en mentionnant l’issue. Ne poussez pas directement sur `main`.

Si le tracé du pays n’existe pas dans le SVG, signalez-le dans l’issue avant de commencer.
