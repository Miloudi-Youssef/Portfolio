package src;

import javax.swing.*;
import java.awt.*;

public class KakuroGUI {

    public static void show(Field[][] grid) {
        int rows = grid.length;
        int cols = grid[0].length;

        JFrame frame = new JFrame("Kakuro GUI Display");
        frame.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        frame.setSize(800, 800);

        JPanel panel = new JPanel(new GridLayout(rows, cols));

        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                JLabel cell = new JLabel();
                cell.setHorizontalAlignment(SwingConstants.CENTER);
                cell.setVerticalAlignment(SwingConstants.CENTER);
                cell.setOpaque(true);
                cell.setBorder(BorderFactory.createLineBorder(Color.BLACK));

                Field field = grid[i][j];

                if (field.isAdjustable()) {
                    // White cell
                    int val = field.getPlayerValue();
                    cell.setText(val == 0 ? "" : String.valueOf(val));
                    cell.setBackground(Color.WHITE);
                } else {
                    int across = field.getAcross();
                    int down = field.getDown();

                    if (across == 0 && down == 0) {
                        // Full black cell
                        cell.setBackground(Color.BLACK);
                        cell.setText("");
                    } else {
                        // Clue cell
                        cell.setBackground(Color.LIGHT_GRAY);
                        String clue = (down > 0 ? down : "") + "/" + (across > 0 ? across : "");
                        cell.setText(clue);
                    }
                }

                panel.add(cell);
            }
        }

        frame.add(panel);
        frame.setVisible(true);
    }
}
