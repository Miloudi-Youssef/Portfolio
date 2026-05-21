package src;
import java.io.File;
import java.util.Scanner;

public class GridReaderIniFormat implements KakuroReader {

    public Field[][] read(String filename) {
        return readIniFormat(filename);
    }
    public static Field[][] readIniFormat(String filename) {
        Field[][] grid = null;
        int rows = 0, cols = 0;

        try {
            Scanner s = new Scanner(new File(filename));


            // Step 1: Read until we hit [dimensions]
            while (s.hasNextLine()) {
                String line = s.nextLine().trim();
                if (line.equals("[dimensions]")) break;
            }

            // Step 2: Read rows and cols
            while (s.hasNextLine()) {
                String line = s.nextLine().trim();
                if (line.startsWith("rows=")) {
                    rows = Integer.parseInt(line.split("=")[1]);
                } else if (line.startsWith("cols=")) {
                    cols = Integer.parseInt(line.split("=")[1]);
                } else if (line.equals("[cells]")) {
                    break;
                }
            }

            grid = new Field[rows][cols];

            // Step 3: Parse cell entries
            while (s.hasNextLine()) {
                String line = s.nextLine().trim();

                if (line.isEmpty() || line.startsWith(";")) continue;

                String[] parts = line.split("=");
                String[] position = parts[0].split("_");
                int row = Integer.parseInt(position[0]);
                int col = Integer.parseInt(position[1]);

                String[] values = parts[1].split(",");
                String type = values[0];
                int downSum = Integer.parseInt(values[1]);
                int rightSum = Integer.parseInt(values[2]);
                int cellValue = Integer.parseInt(values[3]);

                if (type.equals("black")) {
                    grid[row][col] = new Field(0, 0);
                } else if (type.equals("sum")) {
                    grid[row][col] = new Field(rightSum, downSum); // pay attention: across=rightSum
                } else if (type.equals("value")) {
                    grid[row][col] = new Field(); // white cell
                    grid[row][col].setPlayerValue(cellValue); // optional
                } else {
                    System.out.println(" Unknown cell type at " + row + "," + col);
                    System.exit(-1);
                }
            }

            s.close();

        } catch (Exception e) {
            System.out.println("Error reading INI format: " + e.getMessage());
            System.exit(-1);
        }

        return grid;
    }
}
