package src;
public class KakuroDisplay {

    public static void display(Field[][] grid) {
        final int numRows = grid.length;
        final int numCols = grid[0].length;
        for (int i = 0; i < numRows; i++) {
            for (int j = 0; j < numCols; j++) {
                System.out.print(getCellString(grid, i, j));
            }
        }
    }

    public static String getCellString(Field[][] grid, int row, int col) {
        final int numCols = grid[0].length;
        String cellString;
        if (grid[row][col].isAdjustable()) {
            cellString = getAdjustableCellString(grid[row][col].getPlayerValue());
        } else {
            cellString = getNotAdjustableCellString(grid[row][col].getAcross(), grid[row][col].getDown());
        }
        if (col == numCols - 1) {
            cellString += "\n";
        }
        return cellString;
    }

    public static String getAdjustableCellString(int playerValue) {
        String cellString;
        if (playerValue == 0) {
            cellString = "[     ]";
        } else {
            cellString = "[  " + playerValue + "  ]";
        }
        return cellString;
    }

    public static String getNotAdjustableCellString(int across, int down) {
        String cellString;
        String acrossString = "" + across;
        String downString = "" + down;
        int acrossLen = acrossString.length();
        int downLen = downString.length();

        if (downLen == 2) {
            cellString = "[" + downString + "\\" + acrossString;
        } else {
            cellString = "[ " + downString + "\\" + acrossString;
        }
        if (acrossLen == 2) {
            cellString += "]";
        } else {
            cellString += " ]";
        }
        return cellString;
    }
}
