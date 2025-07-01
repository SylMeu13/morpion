const gamemodeSelect = document.getElementById("gamemode")
const versusSelect = document.getElementById("versus")

const startingScreen = document.getElementById("startingScreen")
const gameScreen = document.getElementById("gameScreen")
const gridElement = document.getElementById("grid")

const gamemodeSummary = document.getElementById("gamemodeSummary")
const versusSummary = document.getElementById("versusSummary")

const logsElement = document.getElementById("logs")

const hiddenClass = "hidden"

const player1ImgSrc = "./assets/img/black-circle.svg"
const player2ImgSrc = "./assets/img/red-circle.svg"

let gamemodeType // 0 = Morpion, 1 = Puissance 4 (no gravity), 2 = Puissance 4 (with gravity)
let versusType // 0 = Player versus, 1 = CPU Versus
let turn = 0

let grid
let availableCells = []
let lockGrid = true

function start() {
    startingScreen.classList.add(hiddenClass)

    gamemodeType = parseInt(gamemodeSelect.value)
    versusType = parseInt(versusSelect.value)

    switch (gamemodeType) {
        case 0:
            generateGrid(3, 3)
            gamemodeSummary.textContent = "Mode de Jeu : Morpion"
            break;
        case 1:
            generateGrid(6, 7)
            gamemodeSummary.textContent = "Mode de Jeu : Puissance 4 (sans gravité)"
            break;
        case 2:
            generateGrid(6, 7)
            gamemodeSummary.textContent = "Mode de Jeu : Puissance 4"
            break;
    }
    lockGrid = false

    let turnMessage
    switch (versusType) {
        case 0:
            versusSummary.textContent = "Versus : Joueur (local)"
            turnMessage = "C'est au tour du premier joueur..."
            break;
        case 1:
            versusSummary.textContent = "Versus : Ordinateur"
            turnMessage = "C'est au tour du joueur..."
            break;
    }

    displayToLogs(turnMessage)

    gameScreen.classList.remove(hiddenClass)
}

function quit() {
    gameScreen.classList.add(hiddenClass)
    lockGrid = true
    displayToLogs("")
    removeGrid()
    turn = 0
    startingScreen.classList.remove(hiddenClass)
}

function generateGrid(rows, cols) {
    const tableElem = document.createElement("table")
    grid = new Array(rows)
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        const currentRow = rowIndex
        const rowElement = document.createElement("tr")

        grid[rowIndex] = new Array(cols)
        for (let colIndex = 0; colIndex < cols; colIndex++) {
            const currentCol = colIndex
            const cellElement = document.createElement("td")
            cellElement.addEventListener("click", __ => onCellClick(currentRow, currentCol))
            rowElement.appendChild(cellElement)

            grid[rowIndex][colIndex] = { side: null, elem: cellElement }
            availableCells.push({ row: currentRow, col: currentCol })
        }

        tableElem.appendChild(rowElement)
    }
    gridElement.appendChild(tableElem)
}

function removeGrid() {
    gridElement.removeChild(gridElement.firstElementChild)
    grid = null
    availableCells = []
}

function onCellClick(rowIndex, colIndex) {
    if (lockGrid) {
        return
    }

    if (gamemodeType != 2) {
        if (grid[rowIndex][colIndex].side != null) {
            displayToLogs("Cette case est déjà occupé ! Choisissez une autre case...")
            return
        }
    } else {
        let found = false
        for (let i = 0; i < grid.length; i++) {
            if (grid[i][colIndex].side == null) {
                rowIndex = i
                found = true
            }
        }
        if (!found) {
            displayToLogs("Cette colonne est déjà complète ! Choisissez une autre colonne...")
            return
        }
    }

    grid[rowIndex][colIndex].side = turn
    availableCells = availableCells.filter(elem => elem.row != rowIndex || elem.col != colIndex)

    // Place image in cell
    const img = document.createElement("img")
    img.src = turn == 0 ? player1ImgSrc : player2ImgSrc
    img.alt = `Player ${turn + 1} Circle`
    grid[rowIndex][colIndex].elem.appendChild(img)

    // Check line or grid completion
    let victory
    switch (gamemodeType) {
        case 0:
            victory = checkMorpionLinesAround(rowIndex, colIndex)
            break;
        case 1:
        case 2:
            victory = checkPower4LinesAround(rowIndex, colIndex)
            break;
    }

    if (victory) {
        displayVictory(turn)
        return;
    }

    if (availableCells.length == 0) {
        lockGrid = true
        displayToLogs("La grille est rempli, match nul !")
        return
    }

    if (++turn > 1) {
        turn = 0
    }
    if (versusType == 1 && turn == 1) {
        cpuPlay()
        if (!lockGrid)
            displayToLogs("L'ordinateur à joué, c'est à votre tour...")
    } else if (versusType == 0) {
        if (turn == 0) {
            displayToLogs("C'est au tour du premier joueur...")
        } else {
            displayToLogs("C'est au tour du second joueur...")
        }
    }
}

function checkMorpionLinesAround(rowIndex, colIndex) {
    const side = grid[rowIndex][colIndex].side

    let completedLine = true
    for (let i = 0; i < 3; i++) {
        if (grid[rowIndex][i].side != side) {
            completedLine = false
            break;
        }
    }
    if (completedLine) {
        return true
    }

    completedLine = true
    for (let i = 0; i < 3; i++) {
        if (grid[i][colIndex].side != side) {
            completedLine = false
            break;
        }
    }
    if (completedLine) {
        return true
    }

    if (Math.abs(rowIndex - 1) == Math.abs(colIndex - 1)) {
        return grid[1][1].side == side && ((grid[0][0].side == side && grid[2][2].side == side) || (grid[0][2].side == side && grid[2][0].side == side))
    } else {
        return false
    }
}

function checkPower4LinesAround(rowIndex, colIndex) {
    const side = grid[rowIndex][colIndex].side

    // check positive row
    let sideCount = 1
    let limit = Math.min(rowIndex + (4 - sideCount), grid.length - 1)
    for (let i = rowIndex + 1; i <= limit && sideCount < 4; i++) {
        if (grid[i][colIndex].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    // check negative row
    limit = Math.max(rowIndex - (4 - sideCount), 0)
    for (let i = rowIndex - 1; i >= limit && sideCount < 4; i--) {
        if (grid[i][colIndex].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    // check positive col
    sideCount = 1
    limit = Math.min(colIndex + (4 - sideCount), grid[rowIndex].length - 1)
    for (let i = colIndex + 1; i <= limit && sideCount < 4; i++) {
        if (grid[rowIndex][i].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    // check negative col
    limit = Math.max(colIndex - (4 - sideCount), 0)
    for (let i = colIndex - 1; i >= limit && sideCount < 4; i--) {
        if (grid[rowIndex][i].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    // check positive \ diagonal
    sideCount = 1
    limit = Math.min(4 - sideCount, grid.length - 1 - rowIndex, grid[0].length - 1 - colIndex)
    for (let i = 1; i <= limit && sideCount < 4; i++) {
        if (grid[rowIndex + i][colIndex + i].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    // check negative \ diagonal
    limit = Math.max(-(4 - sideCount), -colIndex, -rowIndex)
    for (let i = -1; i >= limit && sideCount < 4; i--) {
        if (grid[rowIndex + i][colIndex + i].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    // check positive / diagonal
    sideCount = 1
    limit = Math.min(4 - sideCount, rowIndex, grid[0].length - 1 - colIndex)
    for (let i = 1; i <= limit && sideCount < 4; i++) {
        if (grid[rowIndex - i][colIndex + i].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    // check negative / diagonal
    limit = Math.min(4 - sideCount, colIndex, grid.length - 1 - rowIndex)
    for (let i = 1; i <= limit && sideCount < 4; i++) {
        if (grid[rowIndex + i][colIndex - i].side != side) {
            break
        } else {
            sideCount++
        }
    }
    if (sideCount >= 4) {
        return true
    }

    return false
}

function displayVictory(side) {
    if (versusType == 0) {
        displayToLogs(`Victoire du joueur ${side + 1} !`)
    } else if (side == 0) {
        displayToLogs("Victoire du joueur !")
    } else {
        displayToLogs("Victoire de l'ordinateur !")
    }

    lockGrid = true
}

function cpuPlay() {
    const pickCell = availableCells[Math.floor(Math.random() * availableCells.length)]
    onCellClick(pickCell.row, pickCell.col)
}

function displayToLogs(message) {
    logsElement.textContent = message
}