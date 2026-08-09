const nextDifficulty = (currentDifficulty, score) => {

    if (score >= 8) {
        if (currentDifficulty == "easy") {
            return "medium";
        }
        if (currentDifficulty == "medium") {
            return "hard";
        }
    }

    if (score <= 4) {
        if (currentDifficulty == "medium") {
            return "easy";
        }
        if (currentDifficulty == "hard") {
            return "medium";
        }
    }

    return currentDifficulty;
}

module.exports = nextDifficulty;