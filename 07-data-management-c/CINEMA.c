#include"CINEMA.h"



liste_film inserer_film(liste_film tete, chaine CF,chaine NF,int val,chaine GR)
{
    liste_film renv;
    renv=creer_film(CF,NF,val,GR);
    renv->suiv=tete;
    tete=renv;

    return tete;
}



liste_film creer_film(chaine CF,chaine NF,int val,chaine GR)
{
    liste_film renv=(liste_film)malloc(sizeof(l_film));
    strcpy(renv->code_film,CF);
    strcpy(renv->nom_film,NF);
    renv->annee=val;
    strcpy(renv->GENRE,GR);
    renv->suiv=NULL;
    return renv;
}


liste_film supp_liste_film(liste_film L)
{
    if(L)
    {
        liste_film tmp=NULL;
        while(L)
        {
            tmp=L;
            L=L->suiv;
            tmp=detruire_film(tmp);
        }
    }
    return NULL;
}

T_regarder supp_tableau_film(T_regarder T)
{
    if(T)
    {
        free(T); T=NULL;
    }
    return T;
}

liste_film TF_LF(chaine nomfic)
{
    chaine ch1,ch2,ch3;
    int val;
    liste_film renv=NULL;
    FILE *fic;
    fic=fopen(nomfic,"r");
    while(!feof(fic) && fscanf(fic,"%s %s %d %s",ch1,ch2,&val,ch3)==4)
    {
        renv=inserer_film(renv,ch1,ch2,val,ch3);
    }

    fclose(fic);
    return renv;
}

void TLF_F(liste_film lf, chaine fiche)
{
    liste_film aid=NULL ,renv=lf;
    FILE *fic;
    fic=fopen(fiche,"w");
    while(renv!=NULL)
    {
        int x=fprintf(fic,"%s %s %d %s\n",renv->code_film,renv->nom_film,renv->annee,renv->GENRE);
        if(x==0)
        {
            printf("erreur lors de l'enregistrement dans le fichier !!\n");
            return ;
        }
        aid=renv;
        renv=renv->suiv;
        free(aid); 
    }
    fclose(fic);
}

int longueur_film(liste_film LF)
{
    int a=0;
    liste_film trv=LF;
    while(trv!=NULL)
        {
            a++;
            trv=trv->suiv;
        }
        return a;
}

tab_film TLF_T(liste_film head)
{
    int a=0;
    tab_film renv=NULL;
    if(head!=NULL)
    {
        a=longueur_film(head);
        renv=(tab_film)malloc(a*sizeof(t_film));
        for(int i=0;i<a;i++)
        {
            strcpy((renv+i)->code_film,head->code_film);
            strcpy((renv+i)->nom_film,head->nom_film);
            (renv+i)->annee=head->annee;
            strcpy((renv+i)->GENRE,head->GENRE);
            head=head->suiv;
        }
    }
    
    return renv;
}



liste_film detruire_film(liste_film head)
{
    free(head);
    return NULL;

}

liste_film supprimer_film(liste_film tete ,chaine cd_film)
{
    liste_film ren=tete, prec=NULL;
    
    if(tete!=NULL)
    {
        if(strcmp(ren->code_film,cd_film)==0)
        {
            tete=tete->suiv;
            ren=detruire_film(ren);
        }
        else
        {
            while(ren!=NULL && strcmp(ren->code_film,cd_film)!=0)
            {
                prec=ren;
                ren=ren->suiv;
            }
            if(ren!=NULL)
            {
                prec->suiv=ren->suiv;
                ren=detruire_film(ren);
            }
            else
            printf("\n\t/!\\  ce film n'est pas sur la liste\n ");
        
        }
    }
    

    return tete;
}


tab_film tri_film(tab_film tete, int a)
{
    t_film ech;     int i=0;
    tab_film trenv, parcour,renv;
    for(trenv=tete; trenv<tete+a; trenv++)
    {
        parcour=trenv;
        for (renv=trenv; renv<trenv+(a-i); renv++)
        {
            if(strcmp(parcour->code_film,renv->code_film)>0)
            parcour=renv;
        }
        if(parcour!=trenv)
        {
            strcpy(ech.code_film,parcour->code_film);   strcpy(ech.nom_film,parcour->nom_film);
            ech.annee=parcour->annee;           strcpy(ech.GENRE,parcour->GENRE);
            strcpy(parcour->code_film,trenv->code_film);   strcpy(parcour->nom_film,trenv->nom_film);
            parcour->annee=trenv->annee;  strcpy(parcour->GENRE,trenv->GENRE);
            strcpy(trenv->code_film,ech.code_film);   strcpy(trenv->nom_film,ech.nom_film);
            trenv->annee=ech.annee;   strcpy(trenv->GENRE,ech.GENRE);
        }
        i++;
    }
    
    return tete;
}

Arbre_film creer_ab(chaine CH1, chaine CH2, int v, chaine CH3,Arbre_film sg,Arbre_film sd)
{
    Arbre_film ret=NULL;
    ret=(Arbre_film)malloc(sizeof(arb));
    strcpy(ret->code_film,CH1);
    strcpy(ret->nom_film,CH2);
    ret->annee=v;
    strcpy(ret->GENRE,CH3);
    ret->sad=sd;
    ret->sag=sg;
    return ret;

}






//ajouter les elements en prenant compte de la non degenerescence de l'Arbre_film
//en prenant le milieu  de chaque intervalle scinde
Arbre_film creation_Arbre_film(Arbre_film rac, tab_film tf, int g, int d)
{
    if(g+1==d || g==d)  return rac;
    else
    {
        rac=inserer_ab(rac,tf[(d+g)/2].code_film,tf[(d+g)/2].nom_film,tf[(d+g)/2].annee,tf[(d+g)/2].GENRE);
        rac=creation_Arbre_film(rac,tf,(d+g)/2,d);
        rac=creation_Arbre_film(rac,tf,g,(g+d)/2);
    }
    return rac;
}


Arbre_film inserer_ab(Arbre_film rac, chaine CH1, chaine CH2, int v, chaine CH3)
{
    if(recherche_ABR_F(rac,CH1))
        printf("/!\\ CE FILM EXISTE DEJA");
    else
    {
        if(rac==NULL)
        {
        rac=creer_ab(CH1,CH2,v,CH3,NULL,NULL);
        }
        else
        {
            if(strcmp(rac->code_film,CH1)<0)
            rac->sad=inserer_ab(rac->sad,CH1,CH2,v,CH3);
            else
            rac->sag=inserer_ab(rac->sag,CH1,CH2,v,CH3);
        }

    }
    return rac;
}



/*-------------------------------------------------------------------------------------------------------------------------------*/


L_regarder creer_maillon_regarder(chaine code_film, int num_client ,Date date,Heure heure)
{
    L_regarder L=(L_regarder)malloc(sizeof(cellule_R));
    strcpy(L->code_film,code_film);
    strcpy(L->date,date);
    strcpy(L->heure,heure);
    L->num_client=num_client;
    L->suiv=NULL;
    return L;
}
L_regarder detruire_maillon_regarder(L_regarder L)
{
    if(L)
    free(L);
    return NULL;
}
L_regarder detruire_liste_regarder(L_regarder L)
{
    if(L)
    {
        L_regarder tmp;
        while(L)
        {
            tmp=L->suiv;
            detruire_maillon_regarder(L);
            L=tmp;
        }
    }
    return NULL;
}
int longueur_liste_regarder(L_regarder L)
{
    int n=0;
    L_regarder tmp=L;
    while(tmp)
    {
        n++;tmp=tmp->suiv;
    }
    return n;
}


//***************************************************************************************************************
L_regarder TFL_R(chaine fichier)
{
    L_regarder L=NULL;
    FILE *F=NULL;
    F=fopen(fichier, "r");
    if(F)
    {
        chaine code_film;
        Date date;
        Heure heure; int num_client;
        fscanf(F,"%s %d %s %s", code_film,&num_client,date,heure);
        L=creer_maillon_regarder(code_film, num_client,date,heure);
        L_regarder new_maillon=L;
        while(fscanf(F,"%s %d %s %s", code_film,&num_client,date,heure)!=EOF)
        {
            new_maillon->suiv=creer_maillon_regarder(code_film, num_client, date,heure);
            new_maillon=new_maillon->suiv;
        }
        fclose(F);
    }
    return L;
}

void TLF_R(L_regarder L, chaine fichier)
{
    if(L)
    {
        FILE* F=fopen(fichier,"w");
        if(F)
        {
            L_regarder tmp=L;
            while(tmp)
            {
                fprintf(F,"%s\t%d\t%s\t%s\n",tmp->code_film,tmp->num_client,tmp->date,tmp->heure);
                tmp=tmp->suiv;
            }
            fclose(F);
        }
    }
}

T_regarder TLT_R(L_regarder L)
{
    T_regarder T=NULL;
    if(L)
    {
        int n=longueur_liste_regarder(L);
        T=(T_regarder)malloc(n*sizeof(tab_R));
        L_regarder tmp=L;
        int i=0;
        while(tmp)
        {
            strcpy(T[i].code_film,tmp->code_film);
            strcpy(T[i].date,tmp->date);
            strcpy(T[i].heure,tmp->heure);
            T[i].num_client=tmp->num_client;
            i++; tmp=tmp->suiv;
        }
        return T;
    }
}

//**************************************************************************************
L_regarder inserer_regarder(L_regarder tete, chaine CF,int val,Date date,Heure heure)
{
    L_regarder renv;
    renv=creer_maillon_regarder(CF,val,date,heure);
    renv->suiv=tete;
    tete=renv;
    

    return tete;
}

L_regarder supprimer_maillon_regarder(L_regarder L, chaine code_film, int num_client, Date dat,Heure heure)
{
    if(L)
    {
        L_regarder cour=L,pre=NULL;
        if(strcmp(cour->code_film,code_film)==0 && cour->num_client==num_client && strcmp(cour->date,dat)==0 && strcmp(cour->heure,heure)==0)
        {
            L=L->suiv;
            cour=detruire_maillon_regarder(cour);
        }
        else
        {
            while(cour && strcmp(cour->code_film,code_film)!=0 && cour->num_client!=num_client && strcmp(cour->date,dat)!=0 && strcmp(cour->heure,heure)!=0)
            {
                pre=cour;
                cour=cour->suiv;
            }
            if(cour)
            {
                pre->suiv=cour->suiv;
                cour=detruire_maillon_regarder(cour);
            }
            else
            printf("\n\t/!\\ ne figurent pas sur la liste\n\n");
        }
        
    }
    return L;
}

//********************************************************************************************
//on va utilise ici le QUICK-SORT
void trier_par_num_client_R(T_regarder T, int debut, int fin)
{
    if(debut<fin)
    {
        int pivot=T[(debut+fin)/2].num_client;
        int i=debut,j=fin;
        while(i<j)
        {
            while(T[i].num_client<pivot){i++;}
            while(T[j].num_client>pivot){j--;}
            if(i<j)
            {
                int tmp=T[i].num_client;         chaine C; strcpy(C,T[i].code_film);       Date D; strcpy(D,T[i].date);              Heure H; strcpy(H,T[i].heure); 
                    T[i].num_client=T[j].num_client;       strcpy(T[i].code_film,T[j].code_film);      strcpy(T[i].date,T[j].date);          strcpy(T[i].heure,T[j].heure);
                    T[j].num_client=tmp;                   strcpy(T[j].code_film,C);                   strcpy(T[j].date,D);                  strcpy(T[j].heure,H);
                i++; j--;
            }
            trier_par_num_client_R(T,debut,i-1);
            trier_par_num_client_R(T,j+1,fin);
        }
        
    }
}



T_regarder detruire_tableau_regarder(T_regarder T)
{
    if(T)
    {
        free(T); T=NULL;
    }
    return T;
}

/*************************************************************************************************/

Arbre_R creer_noeud_R(chaine code_film, int num_client,Date dat,Heure heure, Arbre_R g, Arbre_R d)
{
    Arbre_R a=(Arbre_R)malloc(sizeof(Noeud_R));
    strcpy(a->code_film,code_film);
    strcpy(a->date,dat);
    strcpy(a->heure,heure);
    a->num_client=num_client;
    a->sag=g;
    a->sad=d;
    return a;
}
Arbre_R inserer_ABR_R(Arbre_R a, chaine code_film, int num_client, Date dat,Heure heure)
{
    if(a==NULL)
    {
        a=creer_noeud_R(code_film, num_client,dat,heure,NULL,NULL);
    }
    else
    {
        if(num_client>a->num_client)
        {
            a->sad=inserer_ABR_R(a->sad,code_film,num_client,dat,heure);
        }
        else
        {
            a->sag=inserer_ABR_R(a->sag, code_film, num_client,dat,heure);
        }
    }
    return a;
}



Arbre_R TTABR_R(Arbre_R a, T_regarder T,int n)//insertion des elements dans un ABR a partir d'un tableau trié.
{
    if(n!=0)
    {
        int m=n/2;
        a=inserer_ABR_R(a,T[m].code_film, T[m].num_client, T[m].date,T[m].heure);
        a->sag=TTABR_R(a->sag,T,m);
        a->sad=TTABR_R(a->sad,(T+m+1),(n%2==0)?m-1:m);
    }
    return a;
}

Arbre_R detruire_ABR_R(Arbre_R a)
{
    if(!a)
    {
        return NULL;
    }
    else
    {
        a->sag=detruire_ABR_R(a->sag);
        a->sad=detruire_ABR_R(a->sad);
        free(a);a=NULL;
    }
    return NULL;
}
Arbre_D detruire_ABR_D(Arbre_D a)
{
    if(!a)
    {
        return NULL;
    }
    else
    {
        a->sag=detruire_ABR_D(a->sag);
        a->sad=detruire_ABR_D(a->sad);
        free(a);a=NULL;
    }
    return NULL;
}



/*----------------------------------------------------------------------------------------------------------------------*/



listediff creer_mail_diff(chaine film,chaine salle, Date date, Heure heure)
{

   listediff m=(diff*)malloc(sizeof(diff));
   if(m==NULL)
             { exit(-1);}

   strcpy(m->code_film,film);
   strcpy(m->ID_salle,salle);
   strcpy(m->date,date);
   strcpy(m->heure,heure);
   m->suiv=NULL;
return m;
}


listediff inserer_diff(listediff  tete, chaine CF,chaine NF,Date date, Heure heure)
{
    listediff  renv;
    renv=creer_mail_diff(CF,NF,date,heure);
    renv->suiv=tete;
    tete=renv;
    

    return tete;
}

listediff detruire_mail_diff(listediff m)
{
if(m!=NULL)
{free(m);m=NULL;}
return m;
}

listediff supp_diff(listediff tete ,chaine ID_salle, chaine code_film, Date date, Heure heure)
{
    listediff ren=tete, prec=NULL;
    
    if(tete!=NULL)
    {
        if(strcmp(ren->ID_salle,ID_salle)==0 && strcmp(ren->code_film,code_film)==0 && strcmp(ren->date,date)==0 && strcmp(ren->heure,heure)==0)
        {
            tete=tete->suiv;
            ren=detruire_mail_diff(ren);
        }
        else
        {
            while(ren!=NULL && strcmp(ren->ID_salle,ID_salle)!=0 && strcmp(ren->code_film,code_film)!=0 && strcmp(ren->date,date)!=0 && strcmp(ren->heure,heure)!=0)
            {
                prec=ren;
                ren=ren->suiv;
            }
            if(ren!=NULL)
            {
                prec->suiv=ren->suiv;
                ren=detruire_mail_diff(ren);
            }
            else
            printf("\n\t/!\\ Ces informations ne figurent pas sur la liste\n\n");
        
        }
    }
    return tete;
}


listediff detruire_liste_diff(listediff L)
{
    listediff courant=L;
 while(courant!=NULL)
 {
   L=L->suiv;
   courant=detruire_mail_diff(courant);
   courant=L;
 }
 return L;

}


listediff TFL_diff(chaine nomfic)
{
    chaine ch1,ch2;
    Date ch3;
    Heure ch4;
    listediff renv=NULL;
    FILE *fic;
    fic=fopen(nomfic,"r");
    while(!feof(fic) && fscanf(fic,"%s %s %s %s",ch1,ch2,ch3,ch4)==4)
    {
        renv=inserer_diff(renv,ch1,ch2,ch3,ch4);
    }

    fclose(fic);
    return renv;
}


tableau_diff trier_par_id_salle_diff(tableau_diff tete, int a)
{
    T_diff ech;     int i=0;
    tableau_diff trenv, parcour,renv;
    for(trenv=tete; trenv<tete+a; trenv++)
    {
        parcour=trenv;
        for (renv=trenv; renv<trenv+(a-i); renv++)
        {
            if(strcmp(parcour->code_film,renv->code_film)>0)
            parcour=renv;
        }
        if(parcour!=trenv)
        {
            strcpy(ech.code_film,parcour->code_film);   strcpy(ech.ID_salle,parcour->ID_salle);     
            strcpy(ech.date,parcour->date);                        strcpy(ech.heure,parcour->heure); 
            strcpy(parcour->code_film,trenv->code_film);                 strcpy(parcour->ID_salle,trenv->ID_salle);
            strcpy(parcour->date,trenv->date);                     strcpy(parcour->heure,trenv->heure);
            strcpy(trenv->code_film,ech.code_film);            strcpy(trenv->ID_salle,ech.ID_salle);
            strcpy(trenv->date,ech.date);               strcpy(trenv->heure,ech.heure);   
        }
        i++;
    }
    
    return tete;
}

void TLF_diff(listediff L, chaine fichier)
{
    if(L)
    {
        FILE* F=fopen(fichier,"w");
        if(F)
        {
            listediff tmp=L;
            while(tmp)
            {
                fprintf(F,"%s\t%s\t%s\t%s\n",tmp->code_film,tmp->ID_salle,tmp->date,tmp->heure);
                tmp=tmp->suiv;
            }
            fclose(F);
        }
    }
}

int longueur_diff(listediff L)
{ listediff courant=L;
  int i=0;
  while(courant!=NULL)
   {
    i=i+1;
    courant=courant->suiv;
   }
   return i;
}

tableau_diff TLT_diff(listediff L)
{
  
    tableau_diff T=NULL;
    if(L)
    {
        int n=longueur_diff(L);
        T=(tableau_diff)malloc(n*sizeof(T_diff));
        listediff tmp=L;
        int i=0;
        while(tmp)
        {
            strcpy(T[i].ID_salle,tmp->ID_salle);
            strcpy(T[i].code_film,tmp->code_film);
            strcpy(T[i].date,tmp->date);
            strcpy(T[i].heure,tmp->heure);
            
            i++; tmp=tmp->suiv;
        }
        
        return T;
    }
}



tableau_diff detruire_tableau_diff(tableau_diff T)
{
  if(T)
    free(T);
    return NULL;
}


Arbre_D creer_noeud_Diff(chaine code_film, chaine id_sal,Date date,Heure heure, Arbre_D g, Arbre_D d)
{
    Arbre_D a=(Arbre_D)malloc(sizeof(Noeud_D));
    strcpy(a->code_film,code_film);
    strcpy(a->ID_salle,id_sal);
    strcpy(a->date,date);
    strcpy(a->heure,heure);
    a->sag=g;
    a->sad=d;
    return a;
}

Arbre_D inserer_ABR_Diff(Arbre_D a, chaine code_film, chaine id_sal,Date date,Heure heure)
{
    if(a==NULL)
    {
        a=creer_noeud_Diff(code_film, id_sal,date,heure,NULL,NULL);
    }
    else
    {
        if(strcmp(a->code_film,code_film)<0)
        {
            a->sad=inserer_ABR_Diff(a->sad,code_film,id_sal,date,heure);
        }
        else
        {
            a->sag=inserer_ABR_Diff(a->sag, code_film,id_sal,date,heure);
        }
    }
    return a;
}


Arbre_D TTABR_Diff(Arbre_D a, tableau_diff T,int n)
{
    if(n!=0)
    {
        int m=n/2;
        a=inserer_ABR_Diff(a,T[m].code_film, T[m].ID_salle, T[m].date, T[m].heure);
        a->sag=TTABR_Diff(a->sag,T,m);
        a->sad=TTABR_Diff(a->sad,(T+m+1),(n%2==0)?m-1:m);
    }
    return a;
}




Arbre_D detruire_ABR_diff(Arbre_D a)
{
    if(!a)
    {
        return NULL;
    }
    else
    {
        a->sag=detruire_ABR_diff(a->sag);
        a->sad=detruire_ABR_diff(a->sad);
        free(a);a=NULL;
    }
    return NULL;
}


/*-----------------------------------------------------------------------------------------------------*/


Liste_Salle creer_maillon_SALLE(chaine ID ,int num )   {

    Liste_Salle Node = (Liste_Salle)malloc(sizeof(SALLE)) ;

    if(Node){

        Node->capacite = num ;
        strcpy( Node->ID_salle , ID ) ; 
        Node->suiv = NULL ;
        return Node ;

    }else {
        printf("pas assez d'espace") ;
        exit(-1) ;
    }

}

Liste_Salle detruire_maillon_SALLE(Liste_Salle Node) {
    if(Node){

        free(Node) ;
        Node = NULL ;
        return Node ;
    }
}
Liste_Salle detruire_liste (Liste_Salle tete) {
    if(tete){

      Liste_Salle courant = tete;
    
      while(courant){

        courant = courant->suiv ;
        tete = detruire_maillon_SALLE(tete) ;
        tete = courant ;
      }
    }
    return tete ;
}





tableau_Salle trier_salle(tableau_Salle tableau, int taille) {


    for (int i = 0; i < taille - 1; ++i) {


        int min = i;

       
        for (int j = i + 1; j < taille; ++j) {
            if (strcmp(tableau[j].ID_salle , tableau[min].ID_salle)<0) {
                min = j;
            }
        }

        
        if (min != i) {
            tSALLE temp = tableau[i];
            tableau[i] = tableau[min];
            tableau[min] = temp;
        }
    }

    return tableau;
}


Liste_Salle inserer_SALLE (Liste_Salle tete, chaine ID , int n) {
		
    Liste_Salle maillon = creer_maillon_SALLE(ID , n ) ;
	
    maillon->suiv = tete ;
    tete = maillon ;
    return tete ;

}

Liste_Salle TFLS(chaine fichier) {
	
    FILE *file = fopen(fichier, "r") ;

    Liste_Salle maListe = NULL;
    int capacite ; 
    chaine ID ;

    while(!feof(file) && fscanf(file , "%s %d" ,ID, &capacite)==2 ){


        maListe = inserer_SALLE(maListe , ID , capacite) ; 


    } 

    return maListe ; 

}

int longueur(Liste_Salle maListe){
    int i = 0;
    while(maListe){
        i++ ;
        maListe = maListe->suiv ;
    }
    return i ;
}

tableau_Salle TLTS(Liste_Salle maListe ) {
    int nb = longueur(maListe) ;
    tableau_Salle tableau = (tableau_Salle)malloc((nb)*sizeof(tSALLE)) ;

    int i=  0 ;
    while(maListe ){

        tableau[i].capacite = maListe->capacite ;
        strcpy(tableau[i++].ID_salle , maListe->ID_salle );
        maListe = maListe->suiv ;
        

    }
    return tableau ;

}

Liste_Salle supprimer_SALLE (Liste_Salle tete , chaine ID) {
    Liste_Salle prec , courant , p ;

    
  if(tete){

    prec = tete ;   courant = tete ;
    if(strcmp(ID , courant->ID_salle)==0)
        {
            tete=tete->suiv;
            courant=detruire_maillon_SALLE(courant);
        }
    else
    {
        while(courant!=NULL && strcmp(ID , courant->ID_salle) != 0){
        prec = courant ;
        courant = courant->suiv ;

        }
        if(courant){
            p = courant ;
            prec->suiv = courant->suiv ;
            p = detruire_maillon_SALLE(p) ;
        }
        else
        printf("\n\t/!\\ Cette salle n'est pas sur la liste \n\n");
    }

  }
   return tete ;
}


Arbre_Salle creer_noeud(chaine ID_salle , int capacite, Arbre_Salle gauche, Arbre_Salle droit) {
    Arbre_Salle noeud =NULL;
    noeud=(Arbre_Salle)malloc(sizeof(Noeud_Salle));
    if (noeud != NULL) {
        strcpy(noeud->ID_salle ,ID_salle);
        noeud->capacite = capacite;
        noeud->sag = gauche;
        noeud->sad = droit;
    }
    return noeud;
}



Arbre_Salle inserer_abr_Salle(Arbre_Salle ar, chaine ID_salle, int valeur)  {

    if (ar == NULL) 
    {

         ar = creer_noeud(ID_salle ,valeur , NULL , NULL );

    } else 
    {
        if (strcmp(ID_salle, ar->ID_salle) <0) {
       
              ar->sag = inserer_abr_Salle(ar->sag , ID_salle , valeur);

        } else 

            ar->sad = inserer_abr_Salle(ar->sad , ID_salle , valeur);
    }
    
    
    return ar;
}


Arbre_Salle TTAS(Arbre_Salle rac, tableau_Salle tf, int g, int d)
{
    if(g+1==d || g==d)  return rac;
    else
    {
        rac=inserer_abr_Salle(rac,tf[(d+g)/2].ID_salle,tf[(d+g)/2].capacite);
        rac=TTAS(rac,tf,(d+g)/2,d);
        rac=TTAS(rac,tf,g,(g+d)/2);
    }
    return rac;
}

void TLFS(Liste_Salle Salle, chaine fichier) {

    FILE *file = fopen(fichier, "w");

    while (Salle) {

        
        fprintf(file, "%s %d\n", Salle->ID_salle, Salle->capacite);
        Salle = Salle->suiv;

    }

    fclose(file);
    
}

/*------------------------------------------------------------------------------------------------------------------------*/



L_reserver creer_maillon_reserver(chaine num_guichet, int num_client)
{
    L_reserver L=(L_reserver)malloc(sizeof(cellule_RS));
    strcpy(L->num_guichet,num_guichet);
    L->num_client=num_client;
    L->suiv=NULL;
    return L;
}
L_reserver detruire_maillon_reserver(L_reserver L)
{
    if(L)
    free(L);
    return NULL;
}
L_reserver detruire_liste_reserver(L_reserver L)
{
    if(L)
    {
        L_reserver tmp;
        while(L)
        {
            tmp=L->suiv;
            detruire_maillon_reserver(L);
            L=tmp;
        }
    }
    return NULL;
}
int longueur_liste_reserver(L_reserver L)
{
    int n=0;
    L_reserver tmp=L;
    while(tmp)
    {
        n++;tmp=tmp->suiv;
    }
    return n;
}

//***************************************************************************************************************
L_reserver TFL_RS(chaine fichier)
{
    L_reserver L=NULL;
    FILE *F=NULL;
    F=fopen(fichier, "r");
    if(F)
    {
        chaine num_guichet; int num_client;
        fscanf(F,"%s %d", num_guichet,&num_client);
        L=creer_maillon_reserver(num_guichet, num_client);
        L_reserver new_maillon=L;
        while(fscanf(F,"%s %d", num_guichet,&num_client)!=EOF)
        {
            new_maillon->suiv=creer_maillon_reserver(num_guichet, num_client);
            new_maillon=new_maillon->suiv;
        }
        fclose(F);
    }
    return L;
}

void TLF_RS(L_reserver L, chaine fichier)
{
    if(L)
    {
        FILE* F=fopen(fichier,"w");
        if(F)
        {
            L_reserver tmp=L;
            while(tmp)
            {
                fprintf(F,"%s\t%d\n",tmp->num_guichet,tmp->num_client);
                tmp=tmp->suiv;
            }
            fclose(F);
        }
    }
}

T_reserver TLT_RS(L_reserver L)
{
    T_reserver T=NULL;
    if(L)
    {
        int n=longueur_liste_reserver(L);
        T=(T_reserver)malloc(n*sizeof(tab_RS));
        L_reserver tmp=L;
        int i=0;
        while(tmp)
        {
            strcpy(T[i].num_guichet,tmp->num_guichet);
            T[i].num_client=tmp->num_client;
            i++; tmp=tmp->suiv;
        }
        return T;
    }
}


L_reserver inserer_reserver(L_reserver tete, chaine num_guichet,int num_client)
{
    L_reserver renv;
    renv=creer_maillon_reserver(num_guichet,num_client);
    renv->suiv=tete;
    tete=renv;
    

    return tete;
}

L_reserver supprimer_maillon_reserver(L_reserver L, chaine num_guichet, int num_client)
{
    if(L)
    {
        L_reserver cour=L,pre=NULL;
        if(strcmp(cour->num_guichet,num_guichet)==0 && cour->num_client==num_client)
        {
            L=L->suiv;
            cour=detruire_maillon_reserver(cour);
        }
        else
        {
            while(cour && strcmp(cour->num_guichet,num_guichet)!=0 && cour->num_client!=num_client)
            {
                pre=cour;
                cour=cour->suiv;
            }
            if(cour)
            {
                pre->suiv=cour->suiv;
                cour=detruire_maillon_reserver(cour);
            }
            else
            printf("\n\t/!\\ ces information ne figurent pas sur la liste \n\n");
        }
    }
    return L;
}

//********************************************************************************************
//on va utilise ici le QUICK-SORT
void trier_par_num_client_RS(T_reserver T, int debut, int fin)
{
    if(debut<fin)
    {
        int pivot=(T)[(debut+fin)/2].num_client;
        int i=debut,j=fin;
        while(i<j)
        {
            while((T)[i].num_client<pivot){i++;}
            while((T)[j].num_client>pivot){j--;}
            if(i<j)
            {
                int tmp=(T)[i].num_client;         chaine C; strcpy(C,(T)[i].num_guichet);
                    (T)[i].num_client=(T)[j].num_client;    strcpy((T)[i].num_guichet,(T)[j].num_guichet);//SWAP
                    (T)[j].num_client=tmp;                   strcpy((T)[j].num_guichet,C);
                i++; j--;
            }
        trier_par_num_client_RS(T,debut,i-1);
        trier_par_num_client_RS(T,j+1,fin);
        }
        
    }
}



T_reserver detruire_tableau_reserver(T_reserver T)
{
    if(T)
    {
        free(T);
        T=NULL;
    }
    return T;
}

/*************************************************************************************************/

Arbre_RS creer_noeud_RS(chaine num_guichet, int num_client, Arbre_RS g, Arbre_RS d)
{
    Arbre_RS a=(Arbre_RS)malloc(sizeof(Noeud_RS));
    strcpy(a->num_guichet,num_guichet);
    a->num_client=num_client;
    a->sag=g;
    a->sad=d;
    return a;
}
Arbre_RS inserer_ABR_RS(Arbre_RS a, chaine num_guichet, int num_client)
{
    if(a==NULL)
    {
        a=creer_noeud_RS(num_guichet, num_client,NULL,NULL);
    }
    else
    {
        if(num_client>a->num_client)
        {
            a->sad=inserer_ABR_RS(a->sad,num_guichet,num_client);
        }
        else
        {
            a->sag=inserer_ABR_RS(a->sag, num_guichet, num_client);
        }
    }
    return a;
}

Arbre_RS TTABR_RS(Arbre_RS a, T_reserver T,int n)
{
    if(n!=0)
    {
        int m=n/2;
        a=inserer_ABR_RS(a,T[m].num_guichet, T[m].num_client);
        a->sag=TTABR_RS(a->sag,T,m);
        a->sad=TTABR_RS(a->sad,(T+m+1),(n%2==0)?m-1:m);
    }
    return a;
}

void prefixe_g_RS(Arbre_RS a)
{
    if(a!=NULL)
    {
        printf("            | %-11s | %10d |\n",a->num_guichet,a->num_client);
        prefixe_g_RS(a->sag);
        prefixe_g_RS(a->sad);
    }
}

Arbre_RS detruire_ABR_RS(Arbre_RS a)
{
    if(!a)
    {
        return NULL;
    }
    else
    {
        a->sag=detruire_ABR_RS(a->sag);
        a->sad=detruire_ABR_RS(a->sad);
        free(a);
    }
    return NULL;
}


//GUICHET





Liste_Guichet TFLG(chaine fichier) {
   
    FILE *file = fopen(fichier, "r");
   
    Liste_Guichet maListe = NULL;
    chaine num, gerant;

    while (!feof(file) && fscanf(file, "%s %s", num, gerant) == 2) {
   
   
        maListe = inserer_GUICHET(maListe, num, gerant);
   
   
    }


     fclose(file);
    return maListe;

}

void TLFG(Liste_Guichet guichets, chaine fichier) {

    FILE *file = fopen(fichier, "w");

    while (guichets) {
        
        fprintf(file, "%s %s\n", guichets->num_guichet, guichets->gerant_guichet);
        guichets = guichets->suivant;

    }

    fclose(file);

}

Liste_Guichet creer_maillon_GUICHET(chaine num, chaine gerant) {

    Liste_Guichet Node = (Liste_Guichet)malloc(sizeof(Guichet));
    
    if (Node) {

        strcpy(Node->num_guichet, num);
        strcpy(Node->gerant_guichet, gerant);
        Node->suivant = NULL;
        return Node;
        
    } else {
        printf("pas assez d'espace");
        exit(-1);
    }
}

Liste_Guichet detruire_maillon_GUICHET(Liste_Guichet guichet) {
    if (guichet) {

        free(guichet);
        guichet = NULL;
        return guichet;

    }
}

Liste_Guichet detruire_liste_GUICHET(Liste_Guichet guichet) {
   
    if (guichet) {

        Liste_Guichet courant = guichet;
        while (courant) {
            courant = courant->suivant;
            guichet = detruire_maillon_GUICHET(guichet);
            guichet = courant;
        }
    }
    return guichet;
}

Liste_Guichet inserer_GUICHET(Liste_Guichet tete, chaine num, chaine gerant) {
   
    Liste_Guichet maillon = creer_maillon_GUICHET(num, gerant);
   
    maillon->suivant = tete;
    tete = maillon;
    return tete;

}

Liste_Guichet supprimer_GUICHET(Liste_Guichet tete, chaine num) {
    Liste_Guichet prec, courant, p;

  if (tete) {
        prec = tete;
        courant = tete;
        if(strcmp(num, courant->num_guichet)==0)
        {
            tete=tete->suivant;
            courant=detruire_maillon_GUICHET(courant);
        }
        while (courant != NULL && strcmp(num, courant->num_guichet) != 0) {
            prec = courant;
            courant = courant->suivant;
        }
        if (courant) 
        {
            p = courant;
            prec->suivant = courant->suivant;
            p = detruire_maillon_GUICHET(p);
        }
        else
        printf("\n\t/!\\  ce guichet n'est pas sur la liste \n\n");
     
  }
   return tete;
}


int longueur_GUICHET(Liste_Guichet maListe) {
    int i = 0;
    while (maListe) {
        i++;
        maListe = maListe->suivant;
    }
    return i;
}

tableau_Guichet TLGT(Liste_Guichet maListe) {
    int nb = longueur_GUICHET(maListe);
    tableau_Guichet tableau = (tableau_Guichet)malloc((nb) * sizeof(tGuichet));

    int i = 0;
    while (maListe) {

        strcpy(tableau[i].num_guichet, maListe->num_guichet);
        strcpy(tableau[i++].gerant_guichet, maListe->gerant_guichet);
        maListe = maListe->suivant;
        

    }
    return tableau;
}

tableau_Guichet trier_guichet(tableau_Guichet tableau, int taille) {
    
    
    for (int i = 0; i < taille - 1; ++i) {
    
    
        int min = i;
       
       
        for (int j = i + 1; j < taille; ++j) {
            if (strcmp(tableau[j].num_guichet, tableau[min].num_guichet) < 0) {
                min = j;
            }
        }
       
       
        if (min != i) {
            tGuichet temp = tableau[i];
            tableau[i] = tableau[min];
            tableau[min] = temp;
        }
    }
    
    return tableau;
}



int max(int a, int b) {
   
    return (a > b) ? a : b;

}

int hauteur(Arbre_Guichet ar) {
   
    if (ar == NULL) return 0;
   
    return 1 + max(hauteur(ar->sag), hauteur(ar->sad));
}

Arbre_Guichet creer_noeud_Guichet(chaine num, chaine gerant, Arbre_Guichet gauche, Arbre_Guichet droit) {
   
    
    Arbre_Guichet noeud = (Arbre_Guichet)malloc(sizeof(Noeud_Guichet));
   
  
    if (noeud != NULL) {
   
        strcpy(noeud->num_guichet, num);
        strcpy(noeud->gerant_guichet, gerant);
        noeud->sag = gauche;
        noeud->sad = droit;
   
    }
   
    return noeud;

}

Arbre_Guichet inserer_abr_Guichet(Arbre_Guichet ar, chaine num, chaine gerant) {
  
    if (ar == NULL) {
    
        ar = creer_noeud_Guichet(num, gerant, NULL, NULL);
    
    } else 
        if (strcmp(num, ar->num_guichet) < 0) {
            
            ar->sag = inserer_abr_Guichet(ar->sag, num, gerant);
   
         } else 
        
             ar->sad = inserer_abr_Guichet(ar->sad, num, gerant);
         


    return ar;
}


Arbre_Guichet TLAS(Liste_Guichet maListe) {
    Arbre_Guichet ar = NULL;

    if (maListe != NULL) {
        ar = creer_noeud_Guichet(maListe->num_guichet, maListe->gerant_guichet, NULL, NULL);
        maListe = maListe->suivant;

        while (maListe != NULL) {
            ar = inserer_abr_Guichet(ar, maListe->num_guichet, maListe->gerant_guichet);
            maListe = maListe->suivant;
        }
    }

    return ar;
}


Arbre_Guichet TTAG(Arbre_Guichet rac, tableau_Guichet tf,int g, int d)
{
    if(g+1==d || g==d)  return rac;
    else
    {
        rac=inserer_abr_Guichet(rac,tf[(d+g)/2].num_guichet,tf[(d+g)/2].gerant_guichet );
        rac=TTAG(rac,tf,(d+g)/2,d);
        rac=TTAG(rac,tf,g,(g+d)/2);
    }
    return rac;
}




// CLIENT -------------------------------------------------------------------------------------------





int longueur_liste(L_CLIENT L){
    int c1=0;

    L_CLIENT cour1=L;

    while(cour1!=NULL){
        c1++;
        cour1=cour1->suiv;
        }
   return c1;
       }

int NotIn_client(L_CLIENT l,int num_client){

    L_CLIENT tmp=l;
    while(tmp && tmp->num_client != num_client){
        tmp=tmp->suiv;
    }
      if(tmp==NULL)
        return 1;
      else
        return 0;
}
L_CLIENT creer_maillon(int num_client,chaine nom,chaine prenom){
  L_CLIENT m=(L_CLIENT)malloc(sizeof(lClient));
    if(m==NULL)
      {exit(-1);}
      m->num_client=num_client;
    strcpy(m->nom,nom);
    strcpy(m->prenom,prenom);

    m->suiv=NULL;
    return m;
}


L_CLIENT inserer_client(L_CLIENT l,int num_client,chaine nom,chaine prenom)
{
    L_CLIENT m=creer_maillon(num_client,nom,prenom);
    if(l)
    {
        m->suiv=l;
        l=m;
    }
    else
        l=m;
    return l;
}

L_CLIENT TFLC(chaine client){
    FILE *F=fopen(client,"r");
    chaine nom,prenom;
    int num_client;
    L_CLIENT l=NULL;
    while(fscanf(F,"%d %s %s",&num_client,nom,prenom)!=EOF)
        l=inserer_client(l,num_client,nom,prenom);
    return l;
}


L_CLIENT detruire_maillon(L_CLIENT l)
{
  if(l){
    free(l);
    l=NULL;
   }
   return l;
}

void TLFC(L_CLIENT l,chaine client)
{

    if(l){

        FILE* F=fopen(client,"w");
         if(F){
            L_CLIENT tmp=l;
            while(tmp)
            {
                fprintf(F,"%d %s %s\n",tmp->num_client,tmp->nom,tmp->prenom);
                tmp=tmp->suiv;
             }
             fclose(F);
           }
       }
}



T_CLIENT TLT(L_CLIENT l)
{

    int i=0; int n=longueur_liste(l);
    T_CLIENT tab=(T_CLIENT)malloc((n)*sizeof(tClient));

    while(i<n){
        tab[i].num_client=l->num_client;
        strcpy(tab[i].nom,l->nom);
        strcpy(tab[i].prenom,l->prenom);
        i++;
        l=l->suiv;
    }
   return tab;
}

L_CLIENT supprimer_un_client(L_CLIENT tete ,int num_client)
{
    L_CLIENT ren=tete, prec=NULL;
    
    if(tete!=NULL)
    {
        if(ren->num_client==num_client)
        {
            tete=tete->suiv;
            ren=detruire_maillon(ren);
        }
        else
        {
            while(ren!=NULL && ren->num_client!=num_client)
            {
                prec=ren;
                ren=ren->suiv;
            }
            if(ren!=NULL)
            {
                prec->suiv=ren->suiv;
                ren=detruire_maillon(ren);
            }
            else
            printf("\n\t/!\\  ce client n'est pas sur la liste\n");
        
        }
    }
    

    return tete;
}

//tri rapide
void trier_par_num_client_CLIENT(T_CLIENT T, int debut, int fin)
{
    if(debut<fin)
    {
        int pivot=T[(debut+fin)/2].num_client;
        int i=debut,j=fin;
        while(i<j)
        {
            while(T[i].num_client<pivot){i++;}
            while(T[j].num_client>pivot){j--;}
            if(i<j)
            {
                int tmp=T[i].num_client;      chaine C1; strcpy(C1,T[i].nom);        chaine C2; strcpy(C2,T[i].prenom);
                    T[i].num_client=T[j].num_client;    strcpy(T[i].nom,T[j].nom);     strcpy(T[i].prenom,T[j].prenom);
                    T[j].num_client=tmp;                strcpy(T[j].nom,C1);                  strcpy(T[j].prenom,C2);
                i++; j--;
            }
        trier_par_num_client_CLIENT(T,debut,i-1);
        trier_par_num_client_CLIENT(T,j+1,fin);
        }
    }
}

/*******************************************************************************************************************/

Arbre_client creer_noeud_CLIENT(int num_client,chaine nom, chaine prenom, Arbre_client g, Arbre_client d)
{
    Arbre_client a=(Arbre_client)malloc(sizeof(aClient));
    strcpy(a->nom,nom);
    strcpy(a->prenom,prenom);
    a->num_client=num_client;
    a->sag=g;
    a->sad=d;
    return a;
}

Arbre_client inserer_ABR_CLIENT(Arbre_client a, int num_client, chaine nom, chaine prenom)
{
    if(a==NULL)
    {
        a=creer_noeud_CLIENT(num_client,nom, prenom,NULL,NULL);
    }
    else
    {
        if(num_client>a->num_client)
        {
            a->sad=inserer_ABR_CLIENT(a->sad,num_client,nom,prenom);
        }
        else
        {
            a->sag=inserer_ABR_CLIENT(a->sag,num_client,nom,prenom);
        }
    }
    return a;
}


Arbre_client TTABR_CLIENT(Arbre_client a, T_CLIENT T,int n)//insertion des elements dans un ABR a partir d'un tableau trié.
{
    if(n!=0)
    {
        int m=n/2;
        a=inserer_ABR_CLIENT(a,T[m].num_client, T[m].nom,T[m].prenom);
        a->sag=TTABR_CLIENT(a->sag,T,m);
        a->sad=TTABR_CLIENT(a->sad,(T+m+1),(n%2==0)?m-1:m);
    }
    return a;
}


void prefixe_g_CLIENT(Arbre_client a)
{
    if(a!=NULL)
    {
        printf("            | %-10d | %-10s | %-10s |\n",a->num_client,a->nom,a->prenom);
        prefixe_g_CLIENT(a->sag);
        prefixe_g_CLIENT(a->sad);
    }
}


Arbre_client detruire_ABR_CLIENT(Arbre_client a)
{
    if(!a)
    {
        return NULL;
    }
    else
    {
        a->sag=detruire_ABR_CLIENT(a->sag);
        a->sad=detruire_ABR_CLIENT(a->sad);
        free(a);a=NULL;
    }
    return NULL;
}

int nbr_noeud_CLIENT(Arbre_client a)
{
    if(!a)
        return 0;
    else
        return 1+nbr_noeud_CLIENT(a->sag)+nbr_noeud_CLIENT(a->sad);
}





//CONTRAINTS---------------------------------------------------------------


int verification_contrainte_suppression_guichet(Arbre_RS ar , chaine num_guichet)
{

    return !recherche_AB_G_RS(ar , num_guichet);

}


int verification_contrainte_insertion_reservation(Arbre_Guichet ar , Arbre_client ab ,chaine num_guichet , int num_client)
{

    return recherche_abr_Guichet(ar , num_guichet ) && recherche_ABR_CLIENT(ab , num_client) ;

    
}

int verification_contrainte_suppression_client(Arbre_RS ar ,Arbre_R ab  , int num_client )
{

    return !(recherche_ABR_C_RS(ar , num_client) || recherche_ABR_C_R(ab , num_client));

}


int verification_contraint_insertion_regarder(Arbre_film af, Arbre_client ac, chaine cd_film,int num_C)
{
    return recherche_ABR_F(af,cd_film) && recherche_ABR_CLIENT(ac,num_C);
}


int verification_contraint_suppression_Film(Arbre_R AB, Arbre_D AD, chaine cd_film)
{
    return !(recherche_film_dans_R(AB,cd_film) || recherche_film_dans_D(AD,cd_film)) ;
}

int verification_contraint_suppression_Salle(Arbre_D ar,chaine CH)
{
    return !recherche_id_salle_dans_D(ar,CH);
}


int verification_contraint_insertion_diff(Arbre_film ABF, Arbre_Salle ABS,chaine cd_film,chaine Id_sal)
{
    return recherche_ABR_F(ABF,cd_film) && recherche_abr_Salle(ABS,Id_sal);
}


void Charger_liste_Cinema(liste_film *L1 , listediff *L2 , Liste_Guichet *L3 , L_reserver *L4 , L_regarder *L5 , Liste_Salle *L6 , L_CLIENT *L7)
{
    chaine CH1="TABLE_FILM.txt",CH2="TABLE_DIFFUSER.txt",CH3="TABLE_GUICHET.txt",
           CH4="TABLE_RESERVER.txt",CH5="TABLE_REGARDER.txt",CH6="TABLE_SALLE.txt",
           CH7="TABLE_CLIENT.txt";
    *L1 = TF_LF(CH1); 
    *L2 = TFL_diff(CH2);
    *L3 = TFLG(CH3);
    *L4 = TFL_RS(CH4);
    *L5 = TFL_R(CH5);
    *L6 = TFLS(CH6);
    *L7 = TFLC(CH7);

}


void Charger_Tableau_Arbre_Cinema(liste_film  L1, listediff  L2, Liste_Guichet L3, L_reserver L4, L_regarder  L5, Liste_Salle  L6, L_CLIENT L7,
                            tab_film *T1,  tableau_diff *T2, tableau_Guichet *T3, T_reserver *T4, T_regarder *T5,tableau_Salle *T6, T_CLIENT *T7,
                            Arbre_film  *A1, Arbre_D *A2, Arbre_Guichet *A3, Arbre_RS *A4, Arbre_R *A5 , Arbre_Salle *A6, Arbre_client *A7 )
{
    *T1=TLF_T(L1);            *T1=tri_film(*T1,longueur_film(L1));                                  *A1=creation_Arbre_film(*A1,*T1,-1,longueur_film(L1));
    *T2=TLT_diff(L2);         *T2=trier_par_id_salle_diff(*T2,longueur_diff(L2));                   *A2=TTABR_Diff(*A2,*T2,longueur_diff(L2));           
    *T3=TLGT(L3);             *T3=trier_guichet(*T3,longueur_GUICHET(L3));                          *A3=TTAG(*A3,*T3,-1,longueur_GUICHET(L3));
    *T4=TLT_RS(L4);            trier_par_num_client_RS(*T4,0,longueur_liste_reserver(L4)-1);        *A4=TTABR_RS(*A4,*T4,longueur_liste_reserver(L4));
    *T5=TLT_R(L5);             trier_par_num_client_R(*T5,0,longueur_liste_regarder(L5)-1);         *A5=TTABR_R(*A5,*T5,longueur_liste_regarder(L5));
    *T6=TLTS(L6);              *T6=trier_salle(*T6,longueur(L6));                                   *A6=TTAS(*A6,*T6,-1,longueur(L6));
    *T7=TLT(L7);               trier_par_num_client_CLIENT(*T7,0,longueur_liste(L7)-1);             *A7=TTABR_CLIENT(*A7,*T7,longueur_liste(L7));
}


void sauvegarder_Cinema(liste_film L1 , listediff L2 , Liste_Guichet L3 , L_reserver L4 , L_regarder L5 , Liste_Salle L6 , L_CLIENT L7)
{
    chaine CH1="TABLE_FILM.txt",CH2="TABLE_DIFFUSER.txt",CH3="TABLE_GUICHET.txt",
           CH4="TABLE_RESERVER.txt",CH5="TABLE_REGARDER.txt",CH6="TABLE_SALLE.txt",
           CH7="TABLE_CLIENT.txt";
    TLF_F(L1,CH1);
    TLF_diff(L2,CH2);
    TLFG(L3,CH3);
    TLF_RS(L4,CH4);
    TLF_R(L5,CH5);
    TLFS(L6,CH6);
    TLFC(L7,CH7);


}


/*---------------------menu------------------------*/


void MENU_PRINCIPAL()
{
    printf(" \n\n|```````````````MENU PRINCIPAL````````````|\n"
                            "\t\t--------------\n"
           "  \n"
           " 1 : INSERER DANS UNE TABLE\n"
           "  \n"
           " 2 : SUPPRESSION DANS UNE TABLE\n"
           "  \n"
           " 3 : RECHERCHER DANS UNE TABLE\n"
           "  \n"
           " 4 : AFFICHER UNE TABLE\n"
           "  \n"
           " 5 : SIMULATION DES REQUETES\n"
           "  \n"
           " 6 : QUITTER\n");
    printf(" \n|                                         |"
           " \n```````````````````````````````````````````\n");
    
}

void sous_MENU_1()
{
    printf("\n\n 1 : INSERER DANS UNE TABLE\n"
           " |    -------------------\n"
           " |\n"
           " |___a - UN FILM\n"
           " |\n"
           " |___b - UN CLIENT\n"
           " |\n"
           " |___c - UNE RESERVATION\n"
           " |\n"
           " |___d - UNE SALLE\n"
           " |\n"
           " |___e - UNE DIFFUSION\n"
           " |\n"
           " |___f - UN GUICHET \n"
           " |\n"
           " |___g - retour \n\n\n\n");
}

void sous_MENU_2()
{
    printf("\n\n 2 - SUPPRIMER DANS UNE TABLE\n"
           " |    -------------------\n"
           " |\n"
           " |___a - UN FILM\n"
           " |\n"
           " |___b - UN CLIENT\n"
           " |\n"
           " |___c - UNE RESERVATION\n"
           " |\n"
           " |___d - UNE SALLE\n"
           " |\n"
           " |___e - UNE DIFFUSION\n"
           " |\n"
           " |___f - DANS REGARDER\n"
           " |\n"
           " |___g - UN GUICHET \n"
           " |\n"
           " |___h - retour \n\n\n\n");
}


void sous_MENU_3()
{
    printf("\n\n 3 - RECHERCHER DANS UNE TABLE\n"
           " |    -------------------\n"
           " |\n"
           " |___a - UN FILM\n"
           " |\n"
           " |___b - UN CLIENT\n"
           " |\n"
           " |___c - UNE SALLE\n"
           " |\n"
           " |___d - UN GUICHET \n"
           " |\n"
           " |___e - retour \n\n\n\n");
}


void sous_MENU_4()
{
    printf("\n\n 4 - AFFICHER\n"
           " |   ---------\n"
           " |\n"
           " |___a - LES FILMS\n"
           " |\n"
           " |___b - LES CLIENTS\n"
           " |\n"
           " |___c - LES RESERVATIONS\n"
           " |\n"
           " |___d - LES SALLES\n"
           " |\n"
           " |___e - LES DIFFUSIONS\n"
           " |\n"
           " |___f - REGARDER\n"
           " |\n"
           " |___g - LES GUICHETS \n"
           " |\n"
           " |___h - retour \n\n\n\n");
}
void sous_MENU_5()
{
    printf("\n\n 5 - REQUETES\n"
           " |   ---------\n"
           " |\n"
           " |___a - FILMS DIFFUSES DANS TOUTES LES SALLES\n"
           " |\n"
           " |___b - FILMS D\'ACTION REGARDES PAR AUCUN CLIENT\n"
           " |\n"
           " |___c - NOMS ET PRENOMS DES CLIENTS AYANT REGARDE DES FILMS COMEDIES "
                     "A LA SALLE S01 le 10 mars 2010\n"
           " |\n"
           " |___d - LE(S) FILM(S) LE(S) PLUS CELEBRE(S) du cinema\n"
           " |\n"
           " |___e - LES GUICHETS AYANT VENDUS DES TICKETS AUX CLIENTS QUI ONT "
                      "REGARDES LE FILM F07 le 31 decembre 2022\n"
           " |\n"
           " |___f -  retour \n\n\n\n");
}

/*------------------------infos-------------------*/

void saisir_film(chaine CH1,chaine CH2,int *val, chaine CH3)
{
    printf("code film :\t");
    scanf("%s",CH1);
    printf("nom film :\t");
    scanf("%s",CH2);
    printf("annee :\t");
    scanf("%d",&(*val));
    printf("genre :\t");
    scanf("%s",CH3);
}
void saisir_client(int *numc,chaine nom, chaine prenom)
{
    printf("numero du client :\t");
    scanf("%d",&(*numc));
    fflush(stdin);
    printf("nom du client :\t");
    scanf("%s",nom);
    printf("prenom du client :\t");
    scanf("%s",prenom);


}
void saisir_salle(chaine ID_Salle,int *capacite)
{
    printf("ID de la Salle :\t");
    scanf("%s",ID_Salle);
    printf("Capacite de la Salle :\t");
    scanf("%d",&(*capacite));
}
void saisir_guichet(chaine num_guichet,chaine gerant)
{
    printf("numero du guichet  :\t");
    scanf("%s",num_guichet);
    printf("gerant du guichet :\t");
    scanf("%s",gerant);
}
void saisir_reserver(chaine num_guichet,int *num_client)
{
    printf("num du client :\t");
    scanf("%d",&(*num_client));       fflush(stdin);
    printf("numero du guichet  :\t");
    scanf("%s",num_guichet);
}
void saisir_regarder(chaine code_film,int *num_client, Date date,Heure heure)
{
    printf("code film :\t");
    scanf("%s",code_film);
    printf("numero du client :\t");
    scanf("%d",&(*num_client));
    printf("Date de visionnage format JJ/MM/YYYY :\t");
    scanf("%s",date);
    printf("Heure de visionnage format hh:mm   :\t");
    scanf("%s",date);
}
void saisir_diffuser(chaine code_film,chaine ID_Salle, Date date,Heure heure)
{
    printf("code film :\t");
    scanf("%s",code_film);
    printf("ID de la Salle :\t");
    scanf("%s",ID_Salle);
    printf("Date de diffusion format JJ/MM/YYYY :\t");
    scanf("%s",date);
    printf("Heure de diffusion format hh:mm    :\t");
    scanf("%s",date);

    
}



/*----------------------------verification_unicite---------------*/


int verification_unicite_film(Arbre_film AF,
                               chaine code_film)
{
    return !recherche_ABR_F(AF,code_film);
}
int verification_unicite_salle(Arbre_Salle AS,
                               chaine id_salle)
{
    return !recherche_abr_Salle(AS,id_salle);
}
int verification_unicite_client(Arbre_client AC,int num_client)
{
    return !recherche_ABR_CLIENT(AC,num_client);
}
int verification_unicite_regarder(Arbre_R AR,chaine code_film,int num_client,Date date,Heure heure)
{
    return !recherche_ABR_R(AR,code_film,num_client,date,heure);
}
int verification_unicite_guichet(Arbre_Guichet AG,chaine num_guichet)
{
    return !recherche_abr_Guichet(AG,num_guichet);
}
int verification_unicite_diffuser(Arbre_D AD,chaine code_film,chaine id_salle,Date date,Heure heure)
{
    return !recherche_ABR_diff(AD,code_film,id_salle,date,heure);
}
int verification_unicite_reserver(Arbre_RS ARS,chaine num_guichet,int num_client)
{
    return !recherche_ABR_RS(ARS,num_guichet,num_client);
}


/*-----------------------affichage---------------------------*/


void affich_film(tab_film tete,int a)
{
    tete=tri_film(tete,a);
    int i=0;
    tab_film trv=NULL;

    printf("\n\n 4 - AFFICHER\n"
           " |   ---------\n"
           " |\n"
           " |___a - LES FILMS\n"

           " \t\t  +-------------------------------------------------------------+\n"
           " \t\t  | code_film |         nom_film        | annee |    GENRE      |\n"
           " \t\t  +-------------------------------------------------------------+\n"
           "");
    for(trv=tete;trv<tete+a;trv++)
    {
        printf("\t\t  | %-9s | %-23s | %-5d | %-13s |",trv->code_film
                                            ,trv->nom_film
                                            ,trv->annee
                                            ,trv->GENRE);
        printf("\n");
        i++;
    }
     printf("\t\t  +-------------------------------------------------------------+\n");
     printf("\t\t  #%d rows\n\n",i);
}


void afficher_tableau_regarder(T_regarder T, int n)
{
    trier_par_num_client_R(T,0,n-1);
    if(T)
    {
        printf("\n\n 4 - AFFICHER\n"
           " |   ---------\n"
           " |\n"
           " |___f - REGARDER\n\n"
               " \t\t  +---------------------------------------------+\n"
               " \t\t  | code_film | num_client |    date    | heure |\n"
               " \t\t  +---------------------------------------------+\n");
               int i;
        for(i=0; i<n; i++)
        {
        printf(" \t\t  | %-9s | %-10d | %-10s | %-5s |\n",T[i].code_film, T[i].num_client,T[i].date,T[i].heure);
        }
        printf(" \t\t  +---------------------------------------------+\n"
               " \t\t  #%d rows\n",i);
    }
}



void afficher_tableau_diff(tableau_diff T, int n)
{
    T=trier_par_id_salle_diff(T,n);
    if(T)
    {
        printf("\n\n 4 - AFFICHER\n"
           " |   ---------\n"
           " |\n"
           " |___e - LES DIFFUSIONS\n\n"
           " \t\t  +-------------------------------------------+\n");
        printf(" \t\t  | code_film | ID_salle |    date    | heure |\n");
        printf(" \t\t  +-------------------------------------------+\n");
        int i;
        for(i=0; i<n; i++)
        {
        printf(" \t\t  | %-9s | %-8s | %-10s | %-5s |\n",T[i].code_film,T[i].ID_salle,T[i].date,T[i].heure);
        }
        printf(" \t\t  +-------------------------------------------+\n");
        printf(" \t\t  #%d rows\n",i);
    }
}

void afficher_element(tSALLE element) {
    printf(" \t\t  | %-8s | %-8d |\n", element.ID_salle, element.capacite);
}

void afficher_Salle(tableau_Salle tableau, int taille) {
    tableau = trier_salle( tableau , taille);

    printf("\n\n 4 - AFFICHER\n\n"
           " |   ---------\n"
           " |\n"
           " |___d - LES SALLES\n\n"
           " \t\t  +---------------------+\n");
    printf(" \t\t  | ID_salle | capacite |\n");
    printf(" \t\t  +---------------------+\n");
    int i;
    for (i = 0; i < taille; i++) {
        afficher_element(tableau[i]);
    }

    printf(" \t\t  +---------------------+\n");
    printf(" \t\t  #%d rows\n",i);
} 



void afficher_tableau_reserver(T_reserver T, int n)
{
    trier_par_num_client_RS(T,0,n-1);
    if(T)
    {
        printf("\n\n 4 - AFFICHER\n\n"
           " |   ---------\n"
           " |\n"
           " |___c - LES RESERVATIONS\n\n"
               " \t\t  +--------------------------+\n");
        printf(" \t\t  | num_guichet | num_client |\n");
        printf(" \t\t  +--------------------------+\n");
        int i;
        for(i=0; i<n; i++)
        {
        printf(" \t\t  | %-11s | %-10d |\n",T[i].num_guichet, T[i].num_client);
        }
        printf(" \t\t  +--------------------------+\n");
        printf(" \t\t  #%d rows\n",i);
    }
}

void afficher_element_GUICHET(tGuichet element) {
    printf(" \t\t  | %-11s | %-16s |\n", element.num_guichet, element.gerant_guichet);
}

void afficher_tableau_GUICHET(tableau_Guichet tableau, int taille) {
    tableau=trier_guichet(tableau,taille);
    printf("\n\n 4 - AFFICHER\n"
           " |   ---------\n\n"
           " |\n"
           " |___g - LES GUICHETS\n\n"
           " \t\t  +--------------------------------+\n");
    printf(" \t\t  | num_guichet |  gerant_guichet  |\n");
    printf(" \t\t  +--------------------------------+\n");
    int i;
    for (i = 0; i < taille; i++) {
        afficher_element_GUICHET(tableau[i]);
    }

    printf(" \t\t  +--------------------------------+\n");
    printf(" \t\t  #%d rows\n",i);
}

void affiche_tclient(T_CLIENT T,int a)
{
    trier_par_num_client_CLIENT(T,0,a-1);
    T_CLIENT tab;
    printf("\n\n 4 - AFFICHER\n"
           " |   ---------\n\n"
           " |\n"
           " |___b - LES CLIENTS\n\n"
           " \t\t  +--------------------------------------+\n");
    printf(" \t\t  | num_client |    nom     |   prenom   |\n");
    printf(" \t\t  +--------------------------------------+\n");
    for(tab=T;tab<T+a;tab++)
    {
       printf(" \t\t  | %-10d | %-10s | %-10s |\n",tab->num_client,tab->nom,tab->prenom);
    }
    printf(" \t\t  +--------------------------------------+\n");
    printf(" \t\t  #%d rows\n\n",a);
}

/*-------------------------------recherche------------------------------------*/

int recherche_ABR_C_RS(Arbre_RS ar,int num_client)
{
   
    if(ar==NULL) return 0;    
    if(ar->num_client == num_client ) return 1;
    if(ar->num_client < num_client )
    return recherche_ABR_C_RS(ar->sad, num_client) ;
    return recherche_ABR_C_RS(ar->sag, num_client);

}

int recherche_ABR_C_R(Arbre_R ar,int num_client)
{
   
    if(ar==NULL){ return 0;   }
    if(ar->num_client == num_client ){ return 1; }
    if(ar->num_client < num_client)
    {
      return recherche_ABR_C_R(ar->sad, num_client) ;
    }
    return recherche_ABR_C_R(ar->sag, num_client);

}

int recherche_ABR_CLIENT(Arbre_client ar,int num_client)
{
    if(ar== NULL)   return  0 ;
    if(num_client==ar->num_client)  return  1 ;
    if(num_client<ar->num_client) 
        return recherche_ABR_CLIENT(ar->sag , num_client) ;
    else
        return recherche_ABR_CLIENT(ar->sad , num_client) ;
}

int recherche_AB_G_RS(Arbre_RS ab,chaine CH)
{
    if(ab!=NULL)
    {
        if(strcmp(ab->num_guichet,CH)==0) return 1;
        else
        return recherche_AB_G_RS(ab->sag,CH) || recherche_AB_G_RS(ab->sad,CH);
    }
    return 0;
}

int recherche_abr_Guichet(Arbre_Guichet ar , chaine num_guichet){

    if(ar== NULL)   return  0 ;
    if(strcmp(num_guichet , ar->num_guichet)== 0 )  return  1 ;
    if(strcmp(num_guichet , ar->num_guichet)<0) 
        return recherche_abr_Guichet(ar->sag , num_guichet) ;
    else
        return recherche_abr_Guichet(ar->sad , num_guichet) ;

   
}

int recherche_ABR_RS(Arbre_RS a,chaine num_guichet, int num_client)
{
    if(a==NULL)
    {
        return 0;
    }
    else
    {
        if(num_client<a->num_client)
        {
            recherche_ABR_RS(a->sag,num_guichet,num_client);
        }
        else
        {
            if(num_client>a->num_client)
            {
                recherche_ABR_RS(a->sad,num_guichet,num_client);
            }
            else
            {
                if(strcmp(a->num_guichet,num_guichet)==0)
                    return 1;
                return (recherche_ABR_RS(a->sag,num_guichet,num_client) || recherche_ABR_RS(a->sad,num_guichet,num_client));
            }
        }
    }
}
int recherche_abr_Salle(Arbre_Salle ar , chaine ID_salle){

    if(ar== NULL)   return  0 ;
    if(strcmp(ID_salle , ar->ID_salle)== 0 )  return  1 ;
    if(strcmp(ID_salle , ar->ID_salle)<0) 
        return recherche_abr_Salle(ar->sag , ID_salle) ;
    else
        return recherche_abr_Salle(ar->sad , ID_salle) ;

   
}

int recherche_film_dans_D(Arbre_D ab,chaine CH)
{
    if(ab==NULL) return 0;    
    if(strcmp(ab->code_film,CH)==0) return 1;
    if(strcmp(CH,ab->code_film)<0)
    return recherche_film_dans_D(ab->sag,CH) ;
    return recherche_film_dans_D(ab->sad,CH) ;
}

int recherche_ABR_diff(Arbre_D a,chaine code_film, chaine ID_salle,Date dat,Heure heure)
{
    if(a==NULL)
    {
        return 0;
    }
    else
    {
        if(strcmp(code_film,a->code_film)<0)
        {
            recherche_ABR_diff(a->sag,code_film,ID_salle,dat,heure);
        }
        else
        {
            if(strcmp(code_film,a->code_film)>0)
            {
                recherche_ABR_diff(a->sad,code_film,ID_salle,dat,heure);
            }
            else
            {
                if(strcmp(a->ID_salle,ID_salle)==0)
                {
                    if(strcmp(a->date,dat)==0)
                        if(strcmp(a->heure,heure)==0)
                            return 1;

                }        
                return (recherche_ABR_diff(a->sag,code_film,ID_salle,dat,heure) || recherche_ABR_diff(a->sad,code_film,ID_salle,dat,heure));
            }
        }
    }
}

int recherche_ABR_diff_requete1(Arbre_D a,chaine code_film, chaine ID_salle)
{
    if(a==NULL)
    {
        return 0;
    }
    else
    {
        if(strcmp(code_film,a->code_film)<0)
        {
            recherche_ABR_diff_requete1(a->sag,code_film,ID_salle);
        }
        else
        {
            if(strcmp(code_film,a->code_film)>0)
            {
                recherche_ABR_diff_requete1(a->sad,code_film,ID_salle);
            }
            else
            {
                if(strcmp(a->ID_salle,ID_salle)==0 )
                {
                    return 1;
                }        
                return (recherche_ABR_diff_requete1(a->sag,code_film,ID_salle) || recherche_ABR_diff_requete1(a->sad,code_film,ID_salle));
            }
        }
    }
}


int recherche_ABR_diff_requete3(Arbre_D a,chaine code_film, chaine ID_salle,Date dat)
{
    if(a==NULL)
    {
        return 0;
    }
    else
    {
        if(strcmp(code_film,a->code_film)<0)
        {
            recherche_ABR_diff_requete3(a->sag,code_film,ID_salle,dat);
        }
        else
        {
            if(strcmp(code_film,a->code_film)>0)
            {
                recherche_ABR_diff_requete3(a->sad,code_film,ID_salle,dat);
            }
            else
            {
                if(strcmp(a->ID_salle,ID_salle)==0)
                {
                    if(strcmp(a->date,dat)==0)
                            return 1;

                }        
                return (recherche_ABR_diff_requete3(a->sag,code_film,ID_salle,dat) || recherche_ABR_diff_requete3(a->sad,code_film,ID_salle,dat));
            }
        }
    }
}

int recherche_ABR_R(Arbre_R a,chaine code_film, int num_client,Date dat,Heure heure)
{
    if(a==NULL)
    {
        return 0;
    }
    else
    {
        if(num_client<a->num_client)
        {
            recherche_ABR_R(a->sag,code_film,num_client,dat,heure);
        }
        else
        {
            if(num_client>a->num_client)
            {
                recherche_ABR_R(a->sad,code_film,num_client,dat,heure);
            }
            else
            {
                if(strcmp(a->code_film,code_film)==0)
                {
                    if(strcmp(a->date,dat)==0)
                        if(strcmp(a->heure,heure)==0)
                            return 1;

                }        
                return (recherche_ABR_R(a->sag,code_film,num_client,dat,heure) || recherche_ABR_R(a->sad,code_film,num_client,dat,heure));
            }
        }
    }
}
int recherche_ABR_F(Arbre_film ab,chaine CH)
{
    if(ab==NULL) return 0;    
    if(strcmp(ab->code_film,CH)==0) return 1;
    if(strcmp(CH,ab->code_film)<0)
    return recherche_ABR_F(ab->sag,CH) ;
    return recherche_ABR_F(ab->sad,CH) ;
}

int recherche_film_dans_R(Arbre_R ab,chaine CH)
{
    if(ab!=NULL)
    {
        if(strcmp(ab->code_film,CH)==0) return 1;
        else
        return recherche_film_dans_R(ab->sag,CH) || recherche_film_dans_R(ab->sad,CH);
    }
    return 0;
}

int recherche_client_dans_R(Arbre_R abr,int c)
{
 
    if(abr!=NULL)
    {
        if(abr->num_client==c) return 1;
        else
        return recherche_client_dans_R(abr->sag,c) || recherche_client_dans_R(abr->sad,c);
    }
    return 0;
}

int recherche_id_salle_dans_D(Arbre_D ab,chaine CH)
{
    if(ab!=NULL)
    {
        if(strcmp(ab->ID_salle,CH)==0) return 1;
        else
        return recherche_id_salle_dans_D(ab->sag,CH) || recherche_id_salle_dans_D(ab->sad,CH);
    }
    return 0;
}

/*---------------------recherche returnant le resultat-----------------*/



Arbre_client recherche_ABR_1_CLIENT(Arbre_client ar,int num_client)
{
    if(ar== NULL)   return  NULL ;
    if(num_client==ar->num_client)  return  ar ;
    if(num_client<ar->num_client) 
        return recherche_ABR_1_CLIENT(ar->sag , num_client) ;
    else
        return recherche_ABR_1_CLIENT(ar->sad , num_client) ;
}


Arbre_Guichet recherche_abr_1_Guichet(Arbre_Guichet ar , chaine num_guichet){

    if(ar== NULL)   return  NULL ;
    if(strcmp(num_guichet , ar->num_guichet)== 0 )  return  ar ;
    if(strcmp(num_guichet , ar->num_guichet)<0) 
        return recherche_abr_1_Guichet(ar->sag , num_guichet) ;
    else
        return recherche_abr_1_Guichet(ar->sad , num_guichet) ;

   
}

Arbre_Salle recherche_abr_1_Salle(Arbre_Salle ar , chaine ID_salle){

    if(ar== NULL)   return  NULL ;
    if(strcmp(ID_salle , ar->ID_salle)== 0 )  return  ar ;
    if(strcmp(ID_salle , ar->ID_salle)<0) 
        return recherche_abr_1_Salle(ar->sag , ID_salle) ;
    else
        return recherche_abr_1_Salle(ar->sad , ID_salle) ;

   
}

Arbre_film recherche_ABR_1_F(Arbre_film ab,chaine CH)
{
    if(ab==NULL) return NULL;    
    if(strcmp(ab->code_film,CH)==0) return ab;
    if(strcmp(CH,ab->code_film)<0)
    return recherche_ABR_1_F(ab->sag,CH) ;
    return recherche_ABR_1_F(ab->sad,CH) ;
}

Arbre_RS recherche_ABR_C_RS_requete5(Arbre_RS ar,int num_client)
{
   
    if(ar==NULL) return NULL;    
    if(ar->num_client == num_client ) return ar;
    if(ar->num_client < num_client )
    return recherche_ABR_C_RS_requete5(ar->sad, num_client);
    return recherche_ABR_C_RS_requete5(ar->sag, num_client);

}

/*----------afficher element arbre--------------*/


void afficher_element_ABR_client(Arbre_client a)
{
    if(a)
    {
        printf("            +------------------------------------+\n"
               "            | num_client |    nom    |  prenom   |\n"
               "            +------------------------------------+\n"
               "            | %10d | %9s | %9s |\n",a->num_client,a->nom,a->prenom);
        printf("            +------------------------------------+\n");
    }
    else
        printf("\n\t/!\\ client non trouve\n\n");
}
void afficher_element_ABR_guichet(Arbre_Guichet a)
{
    if(a)
    {
        printf("            +------------------------------+\n"
               "            | num_guichet |     gerant     |\n"
               "            +------------------------------+\n"
               "            | %11s | %14s |\n",a->num_guichet,a->gerant_guichet);
        printf("            +------------------------------+\n");
    }
    else
        printf("\n\t/!\\ guichet non trouve\n\n");
}

void afficher_element_ABR_salle(Arbre_Salle a)
{
    if(a)
    {
        printf("            +---------------------+\n"
               "            | ID_salle | capacite |\n"
               "            +---------------------+\n"
               "            | %8s | %8d |\n",a->ID_salle,a->capacite);
        printf("            +---------------------+\n");
    }
    else
        printf("\n\t/!\\ salle non trouve\n\n");
}

void afficher_element_ABR_film(Arbre_film a)
{
    if(a)
    {
        printf("            +---------------------------------------------------+\n"
               "            | num_film |     nom_film     |  annee   |   genre  |\n"
               "            +---------------------------------------------------+\n"
               "            | %8s | %16s | %8d | %8s |\n",a->code_film,a->nom_film,a->annee,a->GENRE);
        printf("            +---------------------------------------------------+\n");
    }
    else
        printf("\n\t/!\\ film non trouve\n\n");
}


/*-------------------------------Requete-------------------------------*/

liste_film requete1(liste_film LF,Arbre_D AD ,Liste_Salle LS)
{
    liste_film renv=NULL;
    while (LF!=NULL)
    {
        Liste_Salle trv=LS;
        if(recherche_film_dans_D(AD,LF->code_film))
        {  
            while(trv)
            {
                if(recherche_ABR_diff_requete1(AD,LF->code_film,trv->ID_salle))  
                        {
                            trv=trv->suiv;
                        }
                else break;
            }
            if(trv==NULL)
                {  renv=inserer_film(renv,LF->code_film,LF->nom_film,LF->annee,LF->GENRE);}
        } 
        LF=LF->suiv;
    }
    return renv;
    
}

liste_film requete2(liste_film LF, Arbre_R AR)
{
    chaine rv="Action";
    liste_film renv=NULL;
    while(LF!=NULL)
    {
        if(strcmp(LF->GENRE,rv)==0)
        {
            if(!recherche_film_dans_R(AR,LF->code_film))
            renv=inserer_film(renv,LF->code_film,LF->nom_film,LF->annee,LF->GENRE);
        }
        LF=LF->suiv;
    }

    return renv;
}

L_CLIENT requete3(L_regarder LR, Arbre_client AC,Arbre_film AF,Arbre_D AD)
{
    Date rv="10/03/2010";
    chaine cv="Comedie",pl="S01";
    Arbre_film trv=NULL;
    Arbre_client trv2=NULL;
    L_CLIENT renv=NULL;
    while(LR)
    {
        if(strcmp(LR->date,rv)==0)
            if(trv=recherche_ABR_1_F(AF,LR->code_film))
                if(strcmp(trv->GENRE,cv)==0)
                    if(recherche_ABR_diff_requete3(AD,LR->code_film,pl,rv))
                    {
                        trv2=recherche_ABR_1_CLIENT(AC,LR->num_client);
                        renv=inserer_client(renv,trv2->num_client,trv2->nom,trv2->prenom);
                    }
        LR=LR->suiv;
    }

    return renv;
}

liste_film requete4(liste_film LF, Arbre_R AR)
{
    liste_film renv=NULL;
    int max=0;
    liste_film trv=LF;
    while(trv)
    {
        int occ=occurence_film_requete(AR,trv->code_film);
        if(max<occ)
            max=occ;
        trv=trv->suiv;
    }
    while(LF)
    {
        int occ=occurence_film_requete(AR,LF->code_film);
        if(max==occ)
            renv=inserer_film(renv,LF->code_film,LF->nom_film,LF->annee,LF->GENRE);
        LF=LF->suiv;
    } 

    return renv;
}

int occurence_film_requete(Arbre_R AR,chaine code_film)
{
    if(AR==NULL)
        return 0;
    if(strcmp(AR->code_film,code_film)==0)
        return 1+occurence_film_requete(AR->sad,code_film)+occurence_film_requete(AR->sag,code_film);
    else
        return occurence_film_requete(AR->sad,code_film)+occurence_film_requete(AR->sag,code_film);
}

L_reserver requete5(L_regarder LR,Arbre_RS ARS)
{
    L_reserver renv=NULL;
    Arbre_RS ars=NULL;
    chaine code_film="F07";
    Date date="31/12/2022";
    while (LR)
    {
        if(strcmp(LR->code_film,code_film)==0 && strcmp(LR->date,date)==0)
        {
            if(ars=recherche_ABR_C_RS_requete5(ARS,LR->num_client))
            {
                renv=inserer_reserver(renv,ars->num_guichet,ars->num_client);
            }
        }
        LR=LR->suiv;
    }
    return renv;
    
}
