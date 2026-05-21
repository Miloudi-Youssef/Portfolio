package src;
import java.util.*;
import java.io.*;



public class GridReaderImposedFormat implements KakuroReader{

    public Field[][] read(String filename) {
        return readImposedFormat(filename); // call renamed method
    }

    public static Field[][] readImposedFormat(String filename) {
        Field[][] grid = null;

        try {
            Scanner s = new Scanner(new File(filename));
            int rows = s.nextInt();
            int cols = s.nextInt();
            s.nextLine(); // move to next line

            grid = new Field[rows][cols];

            for (int i = 0; i < rows; i++) {
                String[] tokens = s.nextLine().trim().split("\\s+");

                for (int j = 0; j < cols; j++) {
                    String cell = tokens[j];

                    if (cell.equals("#")) {
                        grid[i][j] = new Field(0, 0); // black with no clues
                    } else if (cell.equals("_")) {
                        grid[i][j] = new Field(); // white cell
                    } else {
                        int across = 0, down = 0;

                        String[] parts = cell.split("/");

                        for (String part : parts) {
                            if (part.isEmpty()) continue;

                            try {
                                int val = Integer.parseInt(part);
                                if (cell.startsWith(part)) {
                                    across = val;
                                } else {
                                    down = val;
                                }
                            } catch (NumberFormatException ignored) {}
                        }

                        grid[i][j] = new Field(across, down);
                    }
                }
            }

            s.close();

        } catch (Exception e) {
            System.out.println(" Error reading imposed format: " + e.getMessage());
            System.exit(-1);
        }

        return grid;
    }
}
