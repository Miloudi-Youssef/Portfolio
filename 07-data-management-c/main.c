
#include"CINEMA.h"

int main()
{

    liste_film         RQ,LF=RQ=NULL;                   Arbre_film       AF =NULL;                     tab_film         TF =NULL;
    L_CLIENT           RC,LC=RC=NULL;                   Arbre_client     AC =NULL;                     T_CLIENT         TC =NULL;
    L_reserver         RRS,LRS=RRS=NULL;                Arbre_RS         ARS =NULL;                    T_reserver       TRS =NULL;
    listediff          LD =NULL;                        Arbre_D          AD =NULL;                     tableau_diff     TD =NULL;
    Liste_Guichet      LG =NULL;                        Arbre_Guichet    AG =NULL;                     tableau_Guichet  TG =NULL;
    Liste_Salle        LS =NULL;                        Arbre_Salle      AS =NULL;                     tableau_Salle    TS =NULL;
    L_regarder         LR =NULL;                        Arbre_R          AR =NULL;                     T_regarder       TR =NULL;


        char choix_2;
        int choix_1,val,index[14];
    for(int i=0;i<14;i++)  index[i]=1;
        
    
    Date            date,current;   
    Heure           heure;  
    chaine          CH1,CH2,CH3;
    
    Charger_liste_Cinema(&LF,&LD,&LG,&LRS,&LR,&LS,&LC);  
    Charger_Tableau_Arbre_Cinema(LF,LD,LG,LRS,LR,LS,LC,
                                 &TF,&TD,&TG,&TRS,&TR,&TS,&TC,
                                 &AF,&AD,&AG,&ARS,&AR,&AS,&AC
                                 );
    

    do{
        MENU_PRINCIPAL();
        printf("Veuillez donner votre choix  : \t");
        scanf("%d",&choix_1);
        switch (choix_1)
        {
            case 1:
                do
                {

                    sous_MENU_1();
                    printf("     donner votre choix  : \t");
                    fflush(stdin);
                    scanf("%c",&choix_2);
                    switch (choix_2)
                    {
                        case 'a' :
                            saisir_film(CH1,CH2,&val,CH3);
                            if(verification_unicite_film(AF,CH1))
                               {
                                LF=inserer_film(LF,CH1,CH2,val,CH3);
                                index[0]=0;
                                }
                            else
                                printf("\n\n\t/!\\ ce film existe deja\n"); 
                            break;
                        case 'b' :
                            saisir_client(&val,CH1,CH2);
                            if(verification_unicite_client(AC,val))
                                {index[1]=0;
                                 LC=inserer_client(LC,val,CH1,CH2);
                                }
                            else
                                printf("\n\n\t/!\\ ce client figure deja sur la liste\n");
                            break;
                        case 'c' :
                            saisir_reserver(CH1,&val);
                            if( verification_unicite_reserver(ARS,CH1,val))
                                    if(verification_contrainte_insertion_reservation(AG,AC,CH1,val))
                                        {
                                         printf("Donner le code film :\t");
                                         scanf("%s",CH2);
                                         if(verification_contraint_insertion_regarder(AF,AC,CH2,val))
                                         {
                                            printf("date de visionnage : \t");
                                            scanf("%s",date);
                                            index[2]=0;
                                            index[5]=0;
                                            LR=inserer_regarder(LR,CH2,val,date,heure);        
                                            LRS=inserer_reserver(LRS,CH1,val);
                                         }
                                         else
                                         {
                                            printf("\n\n\t/!\\ film non disponible\n");
                                            break;
                                         }
                                        }
                                    else
                                        printf("\n\n\t/!\\ client ou guichet ne figure pas dans la liste!\n\n\a");
                            break;
                        case 'd' :
                            saisir_salle(CH1,&val);
                            if(verification_unicite_salle(AS,CH1))
                                {
                                index[3]=0;
                                LS=inserer_SALLE(LS,CH1,val);
                                }
                            else
                                printf("\n\n\t/!\\ cette salle existe deja\n");
                            break;
                        case 'e' :
                            saisir_diffuser(CH1,CH2,date,heure);
                            if( verification_unicite_diffuser(AD,CH1,CH2,date,heure))
                                if(verification_contraint_insertion_diff(AF,AS,CH1,CH2))
                                    {index[4]=0;
                                     inserer_diff(LD,CH1,CH2,date,heure);
                                    }
                                else
                                    printf("\n\n\t/!\\ ajout de diffusion non permis\n\n");
                            else
                                printf("\n\n\t/!\\ diffusion deja sur la liste\n\n");
                            break;
                        case 'f' :
                            saisir_guichet(CH1,CH2);
                            if(verification_unicite_guichet(AG,CH1))
                                {index[5]=0;
                                    LG=inserer_GUICHET(LG,CH1,CH2);
                                }
                            else
                                printf("\n\n\t/!\\ ce guichet existe deja\n\n");
                            break;
                        case 'g' : 
                            break;
                    
                        default:
                            printf("\n\n\t/!\\ choix indisponible\n\n");
                            break;
                    }
                }while(tolower(choix_2)!='g');
                break;
        
            case 2:
                do
                {
                    sous_MENU_2();
                    printf("Veillez donner votre choix  : \t");
                    fflush(stdin);
                    scanf("%c",&choix_2);
                    switch (choix_2)
                    {
                        case 'a' :
                            printf("code film :\t");
                            scanf("%s",CH1);
                            if(index[4]==0)
                            {
                            TD=TLT_diff(LD);
                            index[4]=1;
                            }
                            if(index[5]==0)
                            {
                            TR=TLT_R(LR);
                            index[5]=1;
                            }
                            if(verification_contraint_suppression_Film(AR,AD,CH1))
                            {
                                index[7]=longueur_film(LF);
                                LF=supprimer_film(LF,CH1);
                                if(index[7]!=longueur_film(LF))
                                index[0]=0;
                            }
                            else
                                printf("\n\n\t/!\\ suppression film non permise!\n\n\a");
                            break;
                        case 'b' :
                            printf("numero client :\t");
                            scanf("%d",&val);
                            if(index[2]==0)
                            {
                            TRS=TLT_RS(LRS);
                            index[2]=1;
                            }
                            if(index[5]==0)
                            {
                            TR=TLT_R(LR);
                            index[5]=1;
                            }
                            if(verification_contrainte_suppression_client(ARS,AR,val))
                            {
                                index[8]=longueur_liste(LC);
                                LC=supprimer_un_client(LC,val);
                                if(index[8]!=longueur_liste(LC))
                                index[1]=0;
                            }
                            else
                                printf("\n\n\t/!\\ suppression client non permise!\n\n\a");
                            break;
                        case 'c' :
                            saisir_reserver(CH1,&val);
                            index[9]=longueur_liste_reserver(LRS);
                            LRS=supprimer_maillon_reserver(LRS,CH1,val);
                            if(index[9]!=longueur_liste_reserver(LRS))
                            index[2]=0;
                            break;
                        case 'd' :
                            printf("ID salle :\t");
                            scanf("%s",CH1);
                            if(index[4]==0)
                            {
                            TD=TLT_diff(LD);
                            index[4]=1;
                            }
                            if(verification_contraint_suppression_Salle(AD,CH1))
                            {
                                index[10]=longueur(LS);
                                LS=supprimer_SALLE(LS,CH1);
                                if(index[10]!=longueur(LS))
                                index[3]=0;
                            }
                            else
                                printf("\n\n\t/!\\ suppression salle non permise!\n\n\a");
                            break;
                        case 'e' :
                            saisir_diffuser(CH1,CH2,date,heure);
                            index[11]=longueur_diff(LD);
                            LD=supp_diff(LD,CH1,CH2,date,heure);
                            if(index[11]!=longueur_diff(LD))
                            index[4]=0;
                            break;
                        case 'f' :
                            saisir_regarder(CH1,&val,date,heure);
                            index[12]=longueur_liste_regarder(LR);
                            LR=supprimer_maillon_regarder(LR,CH1,val,date,heure);
                            if(index[12]!=longueur_liste_regarder(LR))
                            index[5]=0;
                            break;
                        case 'g' :
                            printf("numero guichet :\t");
                            scanf("%s",CH1);
                            if(index[2]==0)
                            {
                            TRS=TLT_RS(LRS);
                            index[2]=1;
                            }
                            if(verification_contrainte_suppression_guichet(ARS,CH1))
                            {
                                index[13]=longueur_GUICHET(LG);
                                LG=supprimer_GUICHET(LG,CH1);
                                if(index[13]!=longueur_GUICHET(LG))
                                index[6]=0;
                            }
                            else
                                printf("\n\n\t/!\\ suppression guichet non permise!\n\n\a");
                            break;
                        case 'h' : 
                            break;
                    
                        default:
                           printf("\n\n\t/!\\ choix non disponible\n\n");
                           break;
                    }
                }while(tolower(choix_2)!='h');
                break;
        
            case 3:
                do
                {
                    sous_MENU_3();
                    printf("Veillez donner votre choix  : \t");
                    fflush(stdin);
                    scanf("%c",&choix_2);
                    switch (choix_2)
                    {
                        case 'a' : 
                            if(index[0]==0)     
                                   {
                                   TF=TLF_T(LF);
                                   index[0]=1;
                                   }
                            printf("code film :\t");
                            scanf("%s",CH1);
                            afficher_element_ABR_film(recherche_ABR_1_F(AF,CH1));
                            break;
                        case 'b' :
                            if(index[1]==0)
                                   {
                                   TC=TLT(LC);
                                   index[1]=1;
                                   }
                            printf("numero client :\t");
                            scanf("%d",&val);
                            afficher_element_ABR_client(recherche_ABR_1_CLIENT(AC,val));
                            break;
                        case 'c' :
                            if(index[3]==0)
                                   {
                                   TS=TLTS(LS);
                                   index[3]=1;
                                   }
                            printf("ID salle :\t");
                            scanf("%s",CH1);
                            afficher_element_ABR_salle(recherche_abr_1_Salle(AS,CH1));
                            break;
                        case 'd' :
                            if(index[6]==0)
                                   {
                                   TG=TLGT(LG);
                                   index[6]=1;
                                   }
                            printf("numero guichet :\t");
                            scanf("%s",CH1);
                            afficher_element_ABR_guichet(recherche_abr_1_Guichet(AG,CH1));
                            break;
                        case 'e' : 
                            break;
                
                        default:
                           printf("\n\n\t/!\\ choix non disponible\n\n");
                           break;
                    }
                }while(tolower(choix_2)!='e');
            
                break;
            case 4:
                do
                {
                    sous_MENU_4();
                    printf("Veillez donner votre choix  : \t");
                    fflush(stdin);
                    scanf("%c",&choix_2);
                    switch (choix_2)
                    {
                        case 'a' : if(index[0]==0)     
                                   {
                                   TF=TLF_T(LF);
                                   index[0]=1;
                                   }
                                   affich_film(TF,longueur_film(LF));
                            break;
                        case 'b' : if(index[1]==0)
                                   {
                                   TC=TLT(LC);
                                   index[1]=1;
                                   }
                                    affiche_tclient(TC,longueur_liste(LC));
                            break;
                        case 'c' : if(index[2]==0)
                                   {
                                   TRS=TLT_RS(LRS);
                                   index[2]=1;
                                   }
                                   afficher_tableau_reserver(TRS,longueur_liste_reserver(LRS));
                            break;
                        case 'd' : if(index[3]==0)
                                   {
                                   TS=TLTS(LS);
                                   index[3]=1;
                                   }
                                   afficher_Salle(TS,longueur(LS));
                            break;
                        case 'e' : if(index[4]==0)
                                   {
                                   TD=TLT_diff(LD);
                                   index[4]=1;
                                   }
                                   afficher_tableau_diff(TD,longueur_diff(LD));
                            break;
                        case 'f' : if(index[5]==0)
                                   {
                                   TR=TLT_R(LR);
                                   index[5]=1;
                                   }
                                   afficher_tableau_regarder(TR,longueur_liste_regarder(LR));
                            break;
                        case 'g' : if(index[6]==0)
                                   {
                                   TG=TLGT(LG);
                                   index[6]=1;
                                   }
                                   afficher_tableau_GUICHET(TG,longueur_GUICHET(LG));
                            break;
                        case 'h' : 
                            break;
                    
                        default:
                            printf("\n\n\t/!\\ choix non disponible\n\n");
                           break;
                    }
                }while(tolower(choix_2)!='h');
            
                break;
            case 5 :
             do{
                    sous_MENU_5();
                    printf("Veillez donner votre choix  : \t");
                    fflush(stdin);
                    scanf("%c",&choix_2);
                    switch (choix_2)
                    {
                        case 'a' : 
                            RQ=requete1(LF,AD ,LS);
                            printf(" \t\t  +-------------------------------------------------------------+\n"
                                " \t\t  | code_film |         nom_film        | annee |    GENRE      |\n"
                                " \t\t  +-------------------------------------------------------------+\n");
                            while(RQ)
                                {
                                    printf("\t\t  | %-9s | %-23s | %-5d | %-13s |\n",RQ->code_film,RQ->nom_film,RQ->annee,RQ->GENRE);
                                    RQ=RQ->suiv;
                                }
                                printf("\t\t  +-------------------------------------------------------------+\n");      
                            break;
                        case 'b' :  
                            RQ=requete2(LF,AR);
                            printf(" \t\t  +-------------------------------------------------------------+\n"
                                " \t\t  | code_film |         nom_film        | annee |    GENRE      |\n"
                                " \t\t  +-------------------------------------------------------------+\n");
                            while(RQ)
                                {
                                    printf("\t\t  | %-9s | %-23s | %-5d | %-13s |\n",RQ->code_film,RQ->nom_film,RQ->annee,RQ->GENRE);
                                    RQ=RQ->suiv;
                                }
                                printf("\t\t  +-------------------------------------------------------------+\n"); 
                            break;
                        case 'c' :  
                            RC=requete3(LR,AC,AF,AD);
                            printf(" \t\t  +--------------------------------------+\n"
                                   " \t\t  | num_client |    nom     |   prenom   |\n"
                                   " \t\t  +--------------------------------------+\n");
                            while(RC)
                            {
                                printf(" \t\t  | %-10d | %-10s | %-10s |\n",RC->num_client,RC->nom,RC->prenom);
                                RC=RC->suiv;
                            }
                            printf(" \t\t  +--------------------------------------+\n");
                            break;
                        case 'd' :  
                            RQ=requete4(LF,AR);
                            printf(" \t\t  +-------------------------------------------------------------+\n"
                                " \t\t  | code_film |         nom_film        | annee |    GENRE      |\n"
                                " \t\t  +-------------------------------------------------------------+\n");
                            while(RQ)
                                {
                                    printf("\t\t  | %-9s | %-23s | %-5d | %-13s |\n",RQ->code_film,RQ->nom_film,RQ->annee,RQ->GENRE);
                                    RQ=RQ->suiv;
                                }
                                printf("\t\t  +-------------------------------------------------------------+\n");   
                            break;
                        case 'e' :
                            RRS=requete5(LR,ARS);
                             printf(" \t\t  +-------------+\n"
                                    " \t\t  | num_guichet |\n"
                                    " \t\t  +-------------+\n");
                            while(RRS)
                            {
                                printf(" \t\t  | %-11s |\n", RRS->num_guichet);
                                RRS=RRS->suiv;
                            }
                            printf(" \t\t  +-------------+\n");
                            break;
                        case 'f' :
                            break;
                        default :
                            printf("\n\n /!\\ votre choix de requete est non disponible\n\n");
                            break;
                    }
                }while(tolower(choix_2)!='f');
                break;
            case 6 :
                break;
            default:
                printf(" /!\\ choix non disponible \n\n");
                break;
        }
    
    }while(choix_1!=6);

    sauvegarder_Cinema(LF,LD,LG,LRS,LR,LS,LC);

    return 0 ;
}