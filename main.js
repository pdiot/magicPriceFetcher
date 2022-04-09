import { BehaviorSubject, combineLatest, find, of, subscribeOn } from 'rxjs';

let $edition_code;
let $collector_number;

/// API spam protection
let $typing;
let timer;

/// DOM Elements
let editionInput;
let collectorInput;
let euPrice;
let euPriceFoil;
let addButton;
let showTableButton;
let cardListTable;
let cardListBody;
let formGroup;

let hideTable;

let currentCard;

main();

function main() {
    init();
    subscribe();
}

function init() {
    $edition_code = new BehaviorSubject();
    $collector_number = new BehaviorSubject();
    $typing = new BehaviorSubject();
    document.addEventListener('DOMContentLoaded', (_) => {
        editionInput = document.querySelector('#editionCodeInput');
        collectorInput = document.querySelector('#collectionNumberInput');
        addButton = document.querySelector('#addToCardListButton');
        showTableButton = document.querySelector('#showTableButton');
        cardListTable = document.querySelector('#cardListTable');
        cardListBody = document.querySelector('#cardListBody');
        formGroup = document.querySelector('#formGroup');

        formGroup.addEventListener('keydown', (event) => {
            if (event?.key === 'Enter') {
                addCardToList();
            }
        });

        displayTableToggle();

        editionInput.addEventListener('input', () => {
            $edition_code.next(editionInput.value);
        });
        editionInput.addEventListener('keydown', () => {
            typewatch();
        });

        collectorInput.addEventListener('input', () => {
            $collector_number.next(collectorInput.value);
        });
        collectorInput.addEventListener('keydown', () => {
            typewatch();
        });

        addButton.addEventListener('click', () => {
            addCardToList();
        });

        showTableButton.addEventListener('click', () => {
            displayTableToggle();
        });

        $typing.next(false);
    });
}

function subscribe() {
    combineLatest($edition_code, $collector_number, $typing).subscribe(
        ([_, __, typing]) => {
            if (!typing) {
                if (checkData()) {
                    fetchPreview();
                }
            }
        }
    );
}

function displayTableToggle() {
    hideTable = !hideTable;
    if (hideTable) {
        cardListTable.style.display = 'none';
    } else {
        cardListTable.style.display = 'table';
        fillTable();
    }
}

function fetchPreview() {
    getCardData(editionInput.value, collectorInput.value, (event) => {
        const response = JSON.parse(event.currentTarget.response);
        currentCard = response;
        setCardImage(response.image_uris.png);
        setPrices(response.prices);
    });
}

function checkData() {
    return (
        editionInput?.value?.length >= 3 && collectorInput?.value?.length > 0
    );
}

function getCardData(editionCode, collectorNumber, callback) {
    const url = `https://api.scryfall.com/cards/${editionCode.toLowerCase()}/${+collectorNumber}`;
    const xhr = new XMLHttpRequest();

    xhr.onload = (event) => callback(event);

    xhr.open('GET', url, true);
    xhr.send();
}

function setCardImage(src) {
    const DOMImage = document.querySelector('#cardPicture');
    DOMImage.setAttribute('src', src);
}

function setPrices(prices) {
    if (!euPrice) {
        euPrice = document.querySelector('#euPrice');
    }
    if (!euPriceFoil) {
        euPriceFoil = document.querySelector('#euPriceFoil');
    }
    euPrice.textContent = prices.eur;
    euPriceFoil.textContent = prices.eur_foil;
}

function typewatch() {
    $typing.next(true);
    currentCard = undefined;
    if (timer) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            $typing.next(false);
        }, 1000);
    } else {
        timer = setTimeout(() => {
            $typing.next(false);
        }, 1000);
    }
}

function addCardToList() {
    if (editionInput.value && collectorInput.value) {
        if (!currentCard) {
            getCardData(editionInput.value, collectorInput.value, (event) => {
                currentCard = JSON.parse(event.currentTarget.response);
                addCurrentCard();
            });
        } else {
            addCurrentCard();
        }
    }
}

function addCurrentCard() {
    let cardList = JSON.parse(localStorage.getItem('cardList'));
    if (cardList) {
        let found = findCard(currentCard, cardList);
        if (found) {
            found.quantity++;
        } else {
            cardList = [
                ...cardList,
                {
                    editionCode: currentCard.set,
                    collectorNumber: currentCard.collector_number,
                    cardName: currentCard.name,
                    eurPrice: currentCard.prices.eur,
                    eurFoilPrice: currentCard.prices.eur_foil,
                    quantity: 1,
                },
            ];
        }
    } else {
        cardList = [
            {
                editionCode: currentCard.set,
                collectorNumber: currentCard.collector_number,
                cardName: currentCard.name,
                eurPrice: currentCard.prices.eur,
                eurFoilPrice: currentCard.prices.eur_foil,
                quantity: 1,
            },
        ];
    }
    localStorage.setItem('cardList', JSON.stringify(cardList));
}

function findCard(card, cardList) {
    let found = cardList.find((value) => {
        return (
            value.editionCode === card.editionCode &&
            value.collectorNumber === card.collectorNumber
        );
    });
    return found;
}

function deleteFromList(card) {
    let cardList = JSON.parse(localStorage.getItem('cardList'));
    if (cardList) {
        cardList = cardList.filter((value) => {
            return (
                value.editionCode !== card.editionCode ||
                value.collectorNumber !== card.collectorNumber
            );
        });
        localStorage.setItem('cardList', JSON.stringify(cardList));
    }
    fillTable();
}

function add(card) {
    const cardList = JSON.parse(localStorage.getItem('cardList'));
    let stored = findCard(card, cardList);
    stored.quantity++;
    localStorage.setItem('cardList', JSON.stringify(cardList));
    fillTable();
}

function remove(card) {
    const cardList = JSON.parse(localStorage.getItem('cardList'));
    let stored = findCard(card, cardList);
    stored.quantity--;
    if (stored.quantity === 0) {
        deleteFromList(card);
    } else {
        localStorage.setItem('cardList', JSON.stringify(cardList));
        fillTable();
    }
}

function fillTable() {
    cardListBody.innerHTML = '';
    const cardList = JSON.parse(localStorage.getItem('cardList'));
    if (cardList) {
        for (const card of cardList) {
            const newRow = cardListBody.insertRow();
            let codeCell = newRow.insertCell();
            let collectorCell = newRow.insertCell();
            let nameCell = newRow.insertCell();
            let eurCell = newRow.insertCell();
            let eurFoilCell = newRow.insertCell();
            let quantityCell = newRow.insertCell();
            let addCell = newRow.insertCell();
            let removeCell = newRow.insertCell();
            let deleteCell = newRow.insertCell();

            codeCell.appendChild(document.createTextNode(card.editionCode));
            collectorCell.appendChild(
                document.createTextNode(card.collectorNumber)
            );
            nameCell.appendChild(document.createTextNode(card.cardName));
            eurCell.appendChild(document.createTextNode(card.eurPrice));
            eurFoilCell.appendChild(document.createTextNode(card.eurFoilPrice));
            quantityCell.appendChild(document.createTextNode(card.quantity));

            let addBtn = document.createElement('button');
            addBtn.innerHTML = 'Add 1';
            addBtn.onclick = () => {
                add(card);
            };
            addCell.appendChild(addBtn);

            let removeBtn = document.createElement('button');
            removeBtn.innerHTML = 'Remove 1';
            removeBtn.onclick = () => {
                remove(card);
            };
            removeCell.appendChild(removeBtn);

            let deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = 'Delete';
            deleteBtn.onclick = () => {
                deleteFromList(card);
            };
            deleteCell.appendChild(deleteBtn);
        }
    }
}
