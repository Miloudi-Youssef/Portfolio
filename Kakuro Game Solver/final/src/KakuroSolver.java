package src;
public class KakuroSolver {

    public static boolean solve(Field[][] grid, int row, int col) {
        final int numRows = grid.length;
        final int numCols = grid[0].length;
    
        //if the function was called on an invalid row, then we solved the puzzle
        if (row == numRows) {
          return true;
        }
        //if columns overflowed, then go to beginning of next line
        else if (col == numCols) {
          return solve(grid, row + 1, 0);
        }
        //if this field is not an adjustable field, go to next field to the right
        else if (!grid[row][col].isAdjustable()) {
          return solve(grid, row, col + 1);
        }
    
        for (int testVal = 1; testVal <= 9; testVal++) {
          if (valid(grid, row, col, testVal)) {
            grid[row][col].setPlayerValue(testVal);
            if (solve(grid, row, col + 1)) {
              return true;
            }
            else {
              grid[row][col].setPlayerValue(0);
            }
          }
        }
        //if we reach here, there is no solution to the puzzle
        return false;
    }

    public static boolean valid(Field[][] grid, int row, int col, int value) {
        int tempSum = value;
        int totalValue = 0;
    
        if (isValidRow(grid, row, col, value) && isValidCol(grid, row, col, value)) {
            return true;
        } else {
            return false;
        }
    }
    
    public static boolean isValidRow(Field[][] grid, int row, int col, int value) {
        int tempSum = value;
        int totalValue = 0;
    
        for (int i = col - 1; i >= 0; i--) {
            if (!grid[row][i].isAdjustable()) {
                totalValue = grid[row][i].getAcross();
                break;
            }
            tempSum += grid[row][i].getPlayerValue();
            if (grid[row][i].getPlayerValue() == value) {
                return false;
            }
        }
    
        if (tempSum > totalValue) {
            return false;
        }
        if (col == grid[0].length - 1) {
            if (tempSum < totalValue) {
                return false;
            }
        } else if (!grid[row][col + 1].isAdjustable()) {
            if (tempSum < totalValue) {
                return false;
            }
        }
    
        return true;
    }
    
    public static boolean isValidCol(Field[][] grid, int row, int col, int value) {
        final int rowLength = grid[0].length;
        int tempSum = value;
        int totalValue = 0;
    
        for (int i = row - 1; i >= 0; i--) {
            if (!grid[i][col].isAdjustable()) {
                totalValue = grid[i][col].getDown();
                break;
            }
            tempSum += grid[i][col].getPlayerValue();
            if (grid[i][col].getPlayerValue() == value) {
                return false;
            }
        }
    
        if (tempSum > totalValue) {
            return false;
        }
        if (row == grid.length - 1) {
            if (tempSum < totalValue) {
                return false;
            }
        } else if (!grid[row + 1][col].isAdjustable()) {
            if (tempSum < totalValue) {
                return false;
            }
        }
    
        return true;
    }
    






}
