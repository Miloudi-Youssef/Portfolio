package src;
import java.io.*;
import java.util.Scanner;


import javax.swing.JFileChooser;

public class Kakuro {

    // class variables
    public Field grid[][]; // 2D array to represent the puzzle grid

    public Kakuro() {
        this.grid = GridReader.readKakuroFile(askUserForFile());
    }

    public Kakuro(String filename) {
        KakuroReader reader = ReaderFactory.getReader(filename);
        this.grid = reader.read(filename);
    }


    private static String askUserForFile() {
        String filename = null;
        File file = null;
        JFileChooser fileopen = new JFileChooser();
        int ret = fileopen.showDialog(null, "Select puzzle file to open");
        if (ret == JFileChooser.APPROVE_OPTION) {
            file = fileopen.getSelectedFile();
            System.out.println("Input puzzle selected: " + file);
            filename = file.getAbsolutePath();

        }
        return filename;
    }

    public void solveAndDisplay() {
        if (KakuroSolver.solve(this.grid, 0, 0)) {
            System.out.println("Solution found:");
            KakuroDisplay.display(this.grid);
        } else {
            System.out.println("no solution found");
        }
    }

    private static void solvePuzzle(String filename) {
        try {
            Kakuro k = new Kakuro(filename);

            System.out.println("Grille initiale :");
            KakuroDisplay.display(k.grid);
            System.out.println();

            System.out.println("Solution trouvée avec succès !");

            k.solveAndDisplay();

        } catch (Exception e) {
            System.out.println("Erreur : impossible de charger ou résoudre le fichier : " + e.getMessage());
        }
    }

    private static void solveAllPuzzles() {
        String[] files = {
                "kakuro0.txt",
                "kakuro1.txt",
                "kakuro2.txt",
                "kakuro3.txt",
                "kakuro4.txt",
                "kakuro0.ini",
                "kakuroimposed0.txt"
        };

        for (String filename : files) {
            solvePuzzle("puzzles/" + filename);
            System.out.println();
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        boolean running = true;

        while (running) {
            System.out.println("==================== Kakuro Solver ====================\n");
            System.out.println("INFORMATION :");
            System.out.println("Ce programme fonctionne correctement en mode terminal.\n");
            System.out.println("Certaines options, comme l'affichage graphique ou la sélection de fichiers,");
            System.out.println("ouvrent des fenêtres externes (interfaces graphiques).");
            System.out.println("Selon votre système d'exploitation ou votre environnement,");
            System.out.println("cela peut entraîner des interruptions temporaires ou des interactions imprévues");
            System.out.println("avec le terminal.");
            System.out.println("Dans ce cas, utilisez l'option 1 (affichage terminal complet)");
            System.out.println("pour une exécution fluide sans interface graphique.\n");
            System.out.println("=======================================================\n");

            System.out.println("Veuillez choisir une option :");
            System.out.println("1. Afficher et voir la solution de tous les puzzles du dossier \"puzzles\" (affichage terminal)");
            System.out.println("2. Choisir un fichier à afficher et voir sa solution (sélection via une fenêtre, affichage terminal)");
            System.out.println("3. Afficher un puzzle choisi en interface graphique (sélection via une fenêtre)");
            System.out.println("4. Choisir une difficulté et voir la solution du puzzle correspondant (affichage terminal)");
            System.out.println("5. Quitter");
            System.out.print("Votre choix : ");

            int choice = scanner.nextInt();
            scanner.nextLine();  // consommer le retour à la ligne

            switch (choice) {
                case 1:
                    solveAllPuzzles(); // à implémenter : boucle sur tous les fichiers de puzzles/
                    break;

                case 2:
                    String terminalFile = askUserForFile();
                    if (terminalFile != null) {
                        Kakuro k = new Kakuro(terminalFile);
                        KakuroDisplay.display(k.grid);
                        k.solveAndDisplay();
                        KakuroDisplay.display(k.grid);
                    } else {
                        System.out.println("Aucun fichier sélectionné.");
                    }
                    break;

                case 3:
                    String guiFile = askUserForFile();
                    if (guiFile != null) {
                        Kakuro guiPuzzle = new Kakuro(guiFile);
                        KakuroGUI.show(guiPuzzle.grid); // avant résolution
                        guiPuzzle.solveAndDisplay();
                        KakuroGUI.show(guiPuzzle.grid); // après résolution
                    } else {
                        System.out.println("Aucun fichier sélectionné.");
                    }
                    break;

                case 4:
                    System.out.println("Choisissez une difficulté :");
                    System.out.println("1. Facile");
                    System.out.println("2. Moyenne");
                    System.out.println("3. Difficile");
                    System.out.print("Votre choix : ");
                    int difficulty = scanner.nextInt();
                    scanner.nextLine();

                    String difficultyFile = null;

                    switch (difficulty) {
                        case 1:
                            difficultyFile = "puzzles/kakuro0.txt";
                            break;
                        case 2:
                            System.out.println("1. kakuro1.txt");
                            System.out.println("2. kakuro2.txt");
                            System.out.print("Votre choix : ");
                            int medChoice = scanner.nextInt();
                            scanner.nextLine();
                            difficultyFile = (medChoice == 1) ? "puzzles/kakuro1.txt" : "puzzles/kakuro2.txt";
                            break;
                        case 3:
                            System.out.println("1. kakuro3.txt");
                            System.out.println("2. kakuro4.txt");
                            System.out.print("Votre choix : ");
                            int hardChoice = scanner.nextInt();
                            scanner.nextLine();
                            difficultyFile = (hardChoice == 1) ? "puzzles/kakuro3.txt" : "puzzles/kakuro4.txt";
                            break;
                        default:
                            System.out.println("Choix invalide.");
                    }

                    if (difficultyFile != null) {
                        Kakuro diffPuzzle = new Kakuro(difficultyFile);
                        KakuroDisplay.display(diffPuzzle.grid);
                        diffPuzzle.solveAndDisplay();

                    }
                    break;

                case 5:
                    running = false;
                    System.out.println("À bientôt !");
                    break;

                default:
                    System.out.println("Choix invalide. Veuillez réessayer.");
            }
        }

        scanner.close();
    }

}
