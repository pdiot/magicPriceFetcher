import { BehaviorSubject, combineLatest, of, subscribeOn } from 'rxjs';

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

        $typing.next(false);
    });
}

function subscribe() {
    combineLatest($edition_code, $collector_number, $typing).subscribe(
        ([edition_code, collector_number, typing]) => {
            console.log('callback latest , typing :', typing);
            if (!typing) {
                checkDataAndFetchPreview(edition_code, collector_number);
            }
        }
    );
}

function checkDataAndFetchPreview(edition_code, collector_number) {
    if (edition_code?.length >= 3 && collector_number) {
        sendRequestForPicture(edition_code, collector_number);
    }
}

function sendRequestForPicture(edition_code, collector_number) {
    const url = `https://api.scryfall.com/cards/${edition_code.toLowerCase()}/${+collector_number}`;
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
        const response = JSON.parse(xhr.response);
        setCardImage(response.image_uris.png);
        setPrices(response.prices);
    };

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
        let cardList = JSON.parse(localStorage.getItem('cardList'));
        if (cardList) {
            cardList = [
                ...cardList,
                {
                    editionCode: editionInput.value,
                    collectorNumber: collectorInput.value,
                },
            ];
        } else {
            cardList = [
                {
                    editionCode: editionInput.value,
                    collectorNumber: collectorInput.value,
                },
            ];
        }
        localStorage.setItem('cardList', JSON.stringify(cardList));
    }
}
