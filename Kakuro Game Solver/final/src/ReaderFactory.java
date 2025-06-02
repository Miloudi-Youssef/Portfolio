package src;

public class ReaderFactory {
    public static KakuroReader getReader(String filename) {
        if (filename.contains("imposed")) {
            return new GridReaderImposedFormat();
        } else if (filename.contains("ini")) {
            return new GridReaderIniFormat();
        } else {
            return new GridReader();
        }
    }
}
