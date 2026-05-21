#ifndef PRJ_H
#define PRJ_H
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

typedef char chaine[200];
typedef char Date[11];
typedef char Heure [6];

typedef struct
{
    chaine code_film;
    chaine nom_film;
    int annee;
    chaine GENRE;
}t_film;


typedef struct film
{
   chaine code_film;
    chaine nom_film;
    int annee;
    chaine GENRE;
    struct film *suiv;
}l_film;

typedef struct fl
{
    chaine code_film;
    chaine nom_film;
    int annee;
    chaine GENRE;
    struct fl *sag;
    struct fl *sad;
}arb;



typedef arb *Arbre_film;
typedef t_film *tab_film;
typedef l_film *liste_film;

int longueur_film(liste_film );

liste_film creer_film(chaine,chaine,int,chaine);
liste_film inserer_film(liste_film, chaine ,chaine ,int ,chaine );
liste_film supprimer_film(liste_film , chaine );
liste_film detruire_film(liste_film );
liste_film supp_liste_film(liste_film);

void TLF_F(liste_film, chaine);
liste_film TF_LF(chaine );
tab_film TLF_T(liste_film ) ;
tab_film tri_film(tab_film , int );
tab_film supp_tab_film(tab_film);

void affich_film(tab_film,int );


Arbre_film inserer_ab (Arbre_film, chaine , chaine , int , chaine );
Arbre_film creation_Arbre_film(Arbre_film , tab_film , int , int );
Arbre_film creer_ab(chaine , chaine , int , chaine ,Arbre_film ,Arbre_film );
int recherche_ABR_F(Arbre_film ,chaine );


/*---------------------------------------------------------------------------------------------------------------------------*/


typedef struct Cellule_R
{
    chaine code_film;
    int num_client;
    Date date;
    Heure heure;
    struct Cellule_R *suiv;
}cellule_R;
typedef cellule_R* L_regarder;

typedef struct
{
    chaine code_film;
    int num_client;
    Date date;
    Heure heure;
}tab_R;
typedef tab_R* T_regarder;

typedef struct noeud_R
{
    chaine code_film;
    int num_client;
    Date date;
    Heure heure;
    struct noeud_R* sag;
    struct noeud_R* sad;
}Noeud_R;
typedef Noeud_R *Arbre_R;

L_regarder creer_maillon_regarder(chaine, int, Date ,Heure );
L_regarder detruire_maillon_regarder(L_regarder);
L_regarder detruire_liste_regarder(L_regarder);
int longueur_liste_regarder(L_regarder);

L_regarder TFL_R(chaine);
void TLF_R(L_regarder, chaine);
T_regarder TLT_R(L_regarder);

L_regarder inserer_regarder(L_regarder, chaine, int,Date , Heure );
L_regarder supprimer_maillon_regarder(L_regarder, chaine, int,Date,Heure);


void trier_par_num_client_R(T_regarder, int, int);
void afficher_tableau_regarder(T_regarder, int);
T_regarder detruire_tableau_regarder(T_regarder);


Arbre_R creer_noeud_R(chaine, int,Date,Heure, Arbre_R, Arbre_R);
Arbre_R inserer_ABR_R(Arbre_R,chaine,int, Date,Heure);
Arbre_R TTABR_R(Arbre_R, T_regarder,int n);
int recherche_ABR_R(Arbre_R,chaine,int,Date,Heure);
int recherche_film_dans_R(Arbre_R ,chaine );
int recherche_client_dans_R(Arbre_R ,int );
int recherche_ABR_C_R(Arbre_R ar,int num_client) ;


Arbre_R detruire_ABR_R(Arbre_R a);


/*---------------------------------------------------------------------------------------------------------------------------*/ 



typedef  struct diff
{
  chaine ID_salle ;
  chaine code_film;
  Date date;
  Heure heure;
  struct diff*suiv;

}diff;
typedef  diff *listediff;

typedef  struct 
{
  chaine ID_salle ;
  chaine code_film;
  Date date;
  Heure heure;
}T_diff;
typedef  T_diff *tableau_diff;

typedef struct noeud_D
{
    chaine ID_salle;
    chaine code_film;
    Date date;
    Heure heure;
    struct noeud_D* sag;
    struct noeud_D* sad;
}Noeud_D;
typedef Noeud_D *Arbre_D;


listediff creer_mail_diff(chaine,chaine,Date,Heure);
listediff detruire_mail_diff(listediff);
listediff detruire_liste_diff(listediff);
int longueur_diff(listediff);


listediff TFL_diff(chaine);
void TLF_diff(listediff, chaine);
tableau_diff TLT_diff(listediff);

listediff supp_diff(listediff,chaine,chaine,Date,Heure);
listediff inserer_diff(listediff,chaine,chaine,Date,Heure);


tableau_diff trier_par_id_salle_diff(tableau_diff , int);
void afficher_tableau_diff(tableau_diff, int);
tableau_diff detruire_tableau_diff(tableau_diff);


Arbre_D creer_noeud_Diff(chaine , chaine ,Date ,Heure , Arbre_D , Arbre_D );
Arbre_D detruire_ABR_D(Arbre_D);
Arbre_D inserer_ABR_Diff(Arbre_D , chaine , chaine, Date, Heure);
Arbre_D TTABR_Diff(Arbre_D , tableau_diff ,int );
int recherche_ABR_diff(Arbre_D, chaine , chaine, Date ,Heure);
int recherche_ABR_diff_Requete1(Arbre_D ,chaine, chaine );
int recherche_ABR_diff_requete3(Arbre_D ,chaine , chaine ,Date );
int recherche_film_dans_D(Arbre_D ,chaine );

Arbre_D detruire_ABR_diff(Arbre_D a);


/*----------------------------------------------------------------------------------------------------*/


typedef struct salle{
    chaine ID_salle ;
    int capacite ;
    struct salle *suiv ;
}SALLE ;
typedef SALLE* Liste_Salle ;

typedef struct{
    chaine ID_salle ;
    int capacite ;
   
}tSALLE ;
typedef tSALLE* tableau_Salle ;

typedef struct noeud{

    chaine ID_salle ;
    int capacite ;
    struct noeud* sag ;
    struct noeud* sad ;

} Noeud_Salle;
typedef Noeud_Salle* Arbre_Salle;


Liste_Salle TFLS(chaine) ;
void TLFS(Liste_Salle , chaine) ;
Liste_Salle creer_maillon_SALLE(chaine,int) ; 
Liste_Salle detruire_maillon_SALLE(Liste_Salle) ; 
Liste_Salle detruire_liste_SALLE(Liste_Salle) ; 
Liste_Salle inserer_SALLE(Liste_Salle , chaine ,int ) ;
Liste_Salle supprimer_SALLE (Liste_Salle , chaine ) ;

int longueur(Liste_Salle maListe) ;

tableau_Salle TLTS(Liste_Salle maListe ) ;
tableau_Salle trier_salle(tableau_Salle , int) ;
void afficher_Salle(tableau_Salle , int ) ;  
void afficher_element(tSALLE ) ; 

Arbre_Salle creer_Noeud_Salle(chaine , int , Arbre_Salle , Arbre_Salle );
Arbre_Salle inserer_abr_Salle(Arbre_Salle , chaine , int ) ;

int recherche_abr_Salle(Arbre_Salle , chaine ) ;
int recherche_id_salle_dans_D(Arbre_D,chaine);
Arbre_Salle TTAS(Arbre_Salle , tableau_Salle , int , int );


/*-----------------------------------------------------------------------------------------------------------------------*/



typedef struct guichet {
    chaine num_guichet;
    chaine gerant_guichet;
    struct guichet *suivant;
} Guichet;

typedef Guichet* Liste_Guichet;

typedef struct {
    chaine num_guichet;
    chaine gerant_guichet;
} tGuichet;

typedef tGuichet* tableau_Guichet;

typedef struct noeud_guichet {
    chaine num_guichet;
    chaine gerant_guichet;
    struct noeud_guichet *sag;
    struct noeud_guichet *sad;
} Noeud_Guichet;

typedef Noeud_Guichet* Arbre_Guichet;

Liste_Guichet TFLG(chaine fichier);
void TLFG(Liste_Guichet guichets, chaine fichier);
Liste_Guichet creer_maillon_GUICHET(chaine num, chaine gerant);
Liste_Guichet detruire_maillon_GUICHET(Liste_Guichet guichet);
Liste_Guichet detruire_liste_GUICHET(Liste_Guichet guichets);
Liste_Guichet inserer_GUICHET(Liste_Guichet tete, chaine num, chaine gerant);
Liste_Guichet supprimer_GUICHET(Liste_Guichet tete, chaine num);

void afficher_element_GUICHET(tGuichet element);
void afficher_tableau_GUICHET(tableau_Guichet tableau, int taille);
int longueur_GUICHET(Liste_Guichet maListe);
int max(int a, int b);
int hauteur(Arbre_Guichet ar);

tableau_Guichet TLGT(Liste_Guichet maListe);
tableau_Guichet trier_guichet(tableau_Guichet tableau, int taille);


Arbre_Guichet creer_noeud_Guichet(chaine num, chaine gerant, Arbre_Guichet gauche, Arbre_Guichet droit);
Arbre_Guichet inserer_abr_Guichet(Arbre_Guichet ar, chaine num, chaine gerant);
Arbre_Guichet TLAS(Liste_Guichet maListe);
int recherche_abr_Guichet(Arbre_Guichet ar, chaine num_guichet);
Arbre_Guichet TTAG(Arbre_Guichet ar, tableau_Guichet monTab , int taille,int);



//reserver.h----------------------------------------------------


typedef struct Cellule_RS
{
    chaine num_guichet;
    int num_client;
    struct Cellule_RS *suiv;
}cellule_RS;
typedef cellule_RS* L_reserver;

typedef struct
{
    chaine num_guichet;
    int num_client;
}tab_RS;
typedef tab_RS* T_reserver;

typedef struct noeud_RS
{
    chaine num_guichet;
    int num_client;
    struct noeud_RS* sag;
    struct noeud_RS* sad;
}Noeud_RS;
typedef Noeud_RS *Arbre_RS;

L_reserver creer_maillon_reserver(chaine, int);
L_reserver detruire_maillon_reserver(L_reserver);
L_reserver detruire_liste_reserver(L_reserver);
int longueur_liste_reserver(L_reserver);


L_reserver TFL_RS(chaine);
void TLF_RS(L_reserver, chaine);
T_reserver TLT_RS(L_reserver);

L_reserver inserer_reserver(L_reserver, chaine, int);
L_reserver supprimer_maillon_reserver(L_reserver, chaine, int);

void trier_par_num_client_RS(T_reserver, int, int);
void afficher_tableau_reserver(T_reserver, int);
T_reserver detruire_tableau_reserver(T_reserver);

Arbre_RS creer_noeud_RS(chaine, int, Arbre_RS, Arbre_RS);
Arbre_RS inserer_ABR_RS(Arbre_RS,chaine,int);
Arbre_RS TTABR_RS(Arbre_RS, T_reserver,int n);
int recherche_ABR_RS(Arbre_RS,chaine,int);

Arbre_RS detruire_ABR_RS(Arbre_RS a);


int recherche_AB_G_RS(Arbre_RS ab,chaine CH) ;







//CLIENT.h----------------------------------------------------------------



typedef struct tclient{
    int num_client;
    chaine nom;
    chaine prenom;
}tClient;

typedef tClient* T_CLIENT;

typedef struct lclient{
    int num_client;
    chaine nom;
    chaine prenom;
    struct lclient* suiv;
}lClient;
typedef lClient* L_CLIENT;

typedef struct aclient{
    int num_client;
    chaine nom;
    chaine prenom;
    struct aclient* sag;
    struct aclient* sad;
}aClient;
typedef aClient* Arbre_client;

L_CLIENT TFLC(chaine);
void TLFC(L_CLIENT,chaine);
T_CLIENT TLT(L_CLIENT);

int longueur_liste(L_CLIENT);
L_CLIENT detruire_maillon(L_CLIENT l);
L_CLIENT inserer_client(L_CLIENT,int,chaine,chaine);

void affiche_tclient(T_CLIENT,int);
L_CLIENT supprimer_un_client(L_CLIENT,int num);
void trier_par_num_client_CLIENT(T_CLIENT,int,int);


Arbre_client creer_noeud_CLIENT(int, chaine, chaine, Arbre_client, Arbre_client);
Arbre_client inserer_ABR_CLIENT(Arbre_client,int,chaine,chaine);
Arbre_client TTABR_CLIENT(Arbre_client, T_CLIENT,int);
int recherche_ABR_CLIENT(Arbre_client,int);

Arbre_client detruire_ABR_CLIENT(Arbre_client);
int nbr_noeud_CLIENT(Arbre_client);

int recherche_ABR_C_RS(Arbre_RS ar,int num_client) ;

/*----------------recherche retournant le resultat----------------------*/

Arbre_client recherche_ABR_1_CLIENT(Arbre_client, int);
Arbre_Guichet recherche_abr_1_Guichet(Arbre_Guichet, chaine);
Arbre_Salle recherche_abr_1_Salle(Arbre_Salle, chaine);
Arbre_film recherche_ABR_1_F(Arbre_film ,chaine);
Arbre_RS recherche_ABR_C_RS_requete5(Arbre_RS ,int);


/*------------------------afficher element arbre---------------------------*/

void afficher_element_ABR_client(Arbre_client);
void afficher_element_ABR_guichet(Arbre_Guichet);
void afficher_element_ABR_salle(Arbre_Salle);
void afficher_element_ABR_film(Arbre_film);


/*---------------------------------------------------------------------*/


//CONTRAINTS

int verification_contrainte_suppression_guichet(Arbre_RS ar , chaine num_guichet) ;
int verification_contrainte_suppression_client(Arbre_RS ar ,Arbre_R ab  , int num_client ) ;
int verification_contraint_suppression_Salle(Arbre_D,chaine);
int verification_contraint_suppression_Film(Arbre_R , Arbre_D, chaine);


int verification_contrainte_insertion_reservation(Arbre_Guichet ar , Arbre_client ab ,chaine num_guichet , int num_client) ;
int verification_contraint_insertion_diff(Arbre_film, Arbre_Salle ,chaine ,chaine );
int verification_contraint_insertion_regarder(Arbre_film , Arbre_client, chaine, int);


//charger cinema

void Charger_liste_Cinema(liste_film* , listediff* , Liste_Guichet* , L_reserver* , L_regarder* , Liste_Salle* , L_CLIENT*) ;
void Charger_Tableau_Arbre_Cinema(liste_film  L1, listediff  L2, Liste_Guichet L3, L_reserver L4, L_regarder  L5, Liste_Salle  L6, L_CLIENT L7,
                            tab_film *T1,  tableau_diff *T2, tableau_Guichet *T3, T_reserver *T4, T_regarder *T5,tableau_Salle *T6, T_CLIENT *T7,
                            Arbre_film  *A1, Arbre_D *A2, Arbre_Guichet *A3, Arbre_RS *A4, Arbre_R *A5 , Arbre_Salle *A6, Arbre_client *A7 );


//sauvegarder cinema

void sauvegarder_Cinema(liste_film , listediff , Liste_Guichet , L_reserver , L_regarder , Liste_Salle, L_CLIENT);


/*^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^*/


void MENU_PRINCIPAL();
void sous_MENU_1();
void sous_MENU_2();
void sous_MENU_3();
void sous_MENU_4();
void sous_MENU_5();

/*---------------------------------------------------------------------------------------------*/


void saisir_film(chaine CH1,chaine CH2,int *val, chaine CH3);
void saisir_client(int *numc,chaine CH2, chaine CH3);
void saisir_salle(chaine CH1,int *cap);
void saisir_guichet(chaine CH1,chaine CH2);
void saisir_reserver(chaine CH1,int *numc);
void saisir_regarder(chaine CH1,int *val, Date,Heure);
void saisir_diffuser(chaine CH1,chaine CH2, Date, Heure);


/*--------------------------------------------------------------------------------------------------*/


int verification_unicite_film(Arbre_film,chaine);
int verification_unicite_client(Arbre_client,int );
int verification_unicite_salle(Arbre_Salle,chaine);
int verification_unicite_regarder(Arbre_R,chaine ,int,Date,Heure);
int verification_unicite_guichet(Arbre_Guichet,chaine);
int verification_unicite_diffuser(Arbre_D,chaine,chaine,Date, Heure);
int verification_unicite_reserver(Arbre_RS,chaine,int);






/*-----------------------------------------------------------------------------------------------------*/

liste_film requete1(liste_film ,Arbre_D ,Liste_Salle );
liste_film requete2(liste_film , Arbre_R );
L_CLIENT requete3(L_regarder , Arbre_client ,Arbre_film ,Arbre_D );
liste_film requete4(liste_film , Arbre_R);
int occurence_film_requete(Arbre_R ,chaine);
L_reserver requete5(L_regarder ,Arbre_RS);


#endif