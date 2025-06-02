package src;
import java.util.*;
import java.io.*;



public class GridReader implements KakuroReader{
    public Field[][] read(String filename) {
        return readKakuroFile(filename);
    }
    
    
    public static Field[][] readKakuroFile(String filename) {
    File file = null;
    Field grid[][] = null;
    int rows;
    int cols;
    final int minBoardSize = 2;

    // Open a new file object, and check for exceptions
    file = new File(filename);
        try {
      Scanner s = new Scanner(file);
      int nextInt; // declare an integer to hold the value read.
      int across; // declare integers for future use.
      int down;

      rows = s.nextInt(); // read the first int
      cols = s.nextInt(); // read the second int

      // input validation
      if (rows <= minBoardSize || cols <= minBoardSize) {
        System.out.println("Error - bad input file. One or more of the board "
            + "dimensions is less than two.");
        System.exit(-1);
      }

      // declare a 2D array of Field objects with the correct dimensions.
      grid = new Field[rows][cols];

      // loop over each element in the 2D array O(N)
      for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
          nextInt = s.nextInt(); // read the next int
          if (nextInt < -1) { // check for bad input
            System.out.println("Error - bad input file. There exists an "
                + "integer less than -1");
            System.exit(-1); // exit program
          }
          else if (nextInt == -1) { // check if a white field
            // create the appropriate Field object
            grid[i][j] = new Field();
          }
          else { // otherwise it is a black field
            across = nextInt;
            down = s.nextInt();
			// ints greater than -1 always come in pairs
            if (down < 0) {
              System.out.println("Error - bad input file.");
              System.exit(-1);
            }
            else {
              // create the appropriate Field object
              grid[i][j] = new Field(across, down);
            }
          }
        }
      }
      s.close();
    } catch (FileNotFoundException e) {
      System.out.println("Error - file not found - bye-bye!");
      System.exit(-1);
    } catch (NumberFormatException e) {
      System.out.println("Invalid integer read from file!");
      System.exit(-1);
    } catch (NoSuchElementException e) {
      System.out.println("Ooops, the scanner ran out of integers to read from "
          + "the file before filling the board");
      System.exit(-1);
    }
    return grid; // return the 2D array of Field objects
  }
}