import { Component, OnInit, ViewChild, ElementRef, Inject, Renderer2, ViewEncapsulation, AfterViewInit  } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TableComponent implements OnInit {

  @ViewChild('TableBody') tableBody!: ElementRef;
  @ViewChild('TableLoading') tableLoad!: ElementRef;
  @ViewChild('PokemonSelect') pokemonSelect!: ElementRef;
  @ViewChild('ClaimerSelect') claimerSelect!: ElementRef;
  @ViewChild('StatusSelect') statusSelect!: ElementRef;
  @ViewChild('GenSelect') genSelect!: ElementRef;
  @ViewChild('SubmitButton') submitButton!: ElementRef;
  @ViewChild('ClearButton') clearButton!: ElementRef;
  @ViewChild('ResultsText') resultText!: ElementRef;

  GETCLAIMSAPI = 'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimtablesgetallentries';
  claimsToElementMap: Map<PokemonEntry, HTMLTableRowElement>;
  claimsTable: String;
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { 
    let tableName = this.route.snapshot.paramMap.get('tableName');
    this.claimsTable = tableName ? tableName : 'UNDEFINED';
    this.claimsToElementMap = new Map<PokemonEntry, HTMLTableRowElement>();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    if (this.claimsTable == 'UNDEFINED') {
      this.tableLoad.nativeElement.innerHTML = 'No Claims Table Found. If this is unexpected, please contact Kenny about this.';
      return;
    }

    let headers = new HttpHeaders();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token');

    this.http.post(this.GETCLAIMSAPI, {
      'table-name': this.claimsTable
    }, { 
      headers: headers,
      responseType: 'text'
    }).subscribe(data => {
      if (data.includes("ResourceNotFoundException")) {
        this.tableLoad.nativeElement.innerHTML = 'No Claims Table Found. If this is unexpected, please contact Kenny about this.';
        return;
      }
      let claimsList = JSON.parse(data)['body'];
      for (let index in claimsList) {
        let newClaimEntry = {
          dex_number: claimsList[index]['dex-number'],
          pokemon: claimsList[index]['pokemon'],
          sprite_url: claimsList[index]['sprite-url'],
          claimer: claimsList[index]['discord-username'],
          nickname: claimsList[index]['nickname'],
          permanent: claimsList[index]['is-permanent'],
        };
        
        this.createSearchElement(claimsList[index]['pokemon']);
        let tableEntry = this.createTableElement(newClaimEntry);
        this.claimsToElementMap.set(newClaimEntry, tableEntry);
      }

      this.tableLoad.nativeElement.remove();
      this.submitButton.nativeElement.disabled = false;
      this.clearButton.nativeElement.disabled = false;
      this.pokemonSelect.nativeElement.disabled = false;
      this.claimerSelect.nativeElement.disabled = false;
      this.statusSelect.nativeElement.disabled = false;
      this.genSelect.nativeElement.disabled = false;
      this.resultText.nativeElement.innerHTML = "Number of Results: " + this.claimsToElementMap.size;
    });
  }

  createSearchElement(pokemon: string) {
    const optionElement = this.document.createElement('option');
    optionElement.value = pokemon;
    optionElement.text = prettyPrintPokemonName(pokemon);

    this.renderer.appendChild(this.pokemonSelect.nativeElement, optionElement);
  }

  createTableElement(entry: PokemonEntry) {
    const claimEntry = this.document.createElement('tr');
    
    const dexNumber = this.document.createElement('th');
    dexNumber.setAttribute('class', 'Table-entryKey');
    dexNumber.innerHTML = entry.dex_number.toString();

    const pokemon = this.document.createElement('td');
    pokemon.setAttribute('class', 'Table-entryText');
    let prettyName = prettyPrintPokemonName(entry.pokemon);
    if(prettyName.toLowerCase() != entry.pokemon) {
      pokemon.innerHTML = prettyPrintPokemonName(entry.pokemon) + " (" + entry.pokemon + ")";
    }
    else {
      pokemon.innerHTML = prettyPrintPokemonName(entry.pokemon);
    }

    const pokemonSprite = this.document.createElement('td');

    const pokemon_img = this.document.createElement('img');
    pokemon_img.setAttribute('class', 'Table-pokemonSprite');
    pokemon_img.setAttribute('src' ,entry.sprite_url);
    pokemon_img.setAttribute('alt', entry.pokemon + ' sprite');

    pokemonSprite.appendChild(pokemon_img);

    const claimer = this.document.createElement('td');
    claimer.setAttribute('class', 'Table-entryText');
    claimer.innerHTML = entry.claimer != 'UNDEFINED' ? entry.claimer : '-';

    const nickname = this.document.createElement('td');
    nickname.setAttribute('class', 'Table-entryText');
    nickname.innerHTML = entry.nickname != 'UNDEFINED' ? entry.nickname : '-';

    const permanent = this.document.createElement('td');
    permanent.setAttribute('class', 'Table-entryText');
    permanent.innerHTML = entry.claimer == 'UNDEFINED' ? '-' : entry.permanent ? 'Permanent' : 'Not Permanent';

    claimEntry.appendChild(dexNumber);
    claimEntry.appendChild(pokemon);
    claimEntry.appendChild(pokemonSprite);
    claimEntry.appendChild(claimer);
    claimEntry.appendChild(nickname);
    claimEntry.appendChild(permanent);

    this.renderer.appendChild(this.tableBody.nativeElement, claimEntry);
    return claimEntry;
  }

  public search(e: Event) {
    let form = e.target as HTMLFormElement;
    let pokemonSearch = form['pokemon'].value;
    let claimed = form['claimed'].value;
    let genNumber = form['generation'].value;
    let claimerSearch = "";
    if(claimed != 'False') {
      claimerSearch = form['claimer'].value;
    }

    let resultsList: Array<PokemonEntry> = [];
    for (let entry of this.claimsToElementMap) {
      if (!isInGeneration(genNumber, entry[0])) {
        entry[1].style.display = "none";
        continue;
      }
      if (pokemonSearch != ""  && pokemonSearch.toLowerCase() != entry[0].pokemon) {
        entry[1].style.display = "none";
        continue;
      }
      if (claimerSearch != "" && !entry[0].claimer.toLowerCase().includes(claimerSearch.toLowerCase())) {
        entry[1].style.display = "none";
        continue;
      }
      if (claimed != 'None') {
        if (claimed == 'True' && entry[0].nickname == 'UNDEFINED') {
          entry[1].style.display = "none";
          continue;
        }
        else if (claimed == 'False' && entry[0].nickname != 'UNDEFINED') {
          entry[1].style.display = "none";
          continue;
        }
      }
      entry[1].style.display = "";
      resultsList.push(entry[0]);
    }

    this.resultText.nativeElement.innerHTML = "Number of Results: " + resultsList.length;
  }

  public clearSearch() {
    for (let entry of this.claimsToElementMap) {
      entry[1].style.display = "";
    }
    this.resultText.nativeElement.innerHTML = "Number of Results: " + this.claimsToElementMap.size;
  }

  public changeClaimer(e: Event) {
    let form = e.target as HTMLSelectElement;
    if (form.value === 'False') {
      this.claimerSelect.nativeElement.disabled = true;
    }
    else {
      this.claimerSelect.nativeElement.disabled = false;
    }
  }
}

interface PokemonEntry {
  dex_number: number;
  pokemon: string;
  sprite_url: string;
  claimer: string;
  nickname: string;
  permanent: boolean;
}

function prettyPrintPokemonName(pokemon: String) {
  if (pokemon === 'jr')
    return 'Jr.';
  if (pokemon === 'mr') {
    return 'Mr.';
  }
  if (pokemon === 'farfetchd') {
    return 'Farfetch\'d';
  }
  if (pokemon === 'nidoran-f') {
    return "Nidoran (Female)";
  }
  if (pokemon === 'nidoran-m') {
    return "Nidoran (Male)";
  }
  if (pokemon === 'jangmo-o' || pokemon === 'hakamo-o' || pokemon === 'kommo-o') {
    return toCapitalCase(pokemon);
  }
  if (pokemon.includes('-')) {
    let nameSplit = pokemon.split('-');
    let pokemonName = "";
    for (let index = 0; index < nameSplit.length; index++) {
      if (index == nameSplit.length - 1) {
        switch (nameSplit[index]) {
          case 'alola':
            pokemonName = 'Alolan ' + pokemonName;
            break;
          case 'galar':
            pokemonName = 'Galarian ' + pokemonName;
            break;
          case 'hisui':
            pokemonName = 'Hisuian ' + pokemonName;
            break;
          default:
            pokemonName += prettyPrintPokemonName(nameSplit[index])
        }
      }
      else {
        pokemonName += prettyPrintPokemonName(nameSplit[index]) + " ";
      }
    }
    return pokemonName.trim();
  }
  return toCapitalCase(pokemon);
}

function toCapitalCase(string: String) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function isInGeneration(genNumber, pokemonData) {
  switch (genNumber) {
    case "1":
      return pokemonData.dex_number <= 151;
    case "2":
      return pokemonData.dex_number > 151 && pokemonData.dex_number <= 251;
    case "3":
      return pokemonData.dex_number > 251 && pokemonData.dex_number <= 386;
    case "4":
      return pokemonData.dex_number > 386 && pokemonData.dex_number <= 493;
    case "5":
      return pokemonData.dex_number > 493 && pokemonData.dex_number <= 649;
    case "6":
      return pokemonData.dex_number > 649 && pokemonData.dex_number <= 721;
    case "7":
      if(pokemonData.dex_number > 721 && pokemonData.dex_number <= 809)
        return true;
      else {
        if(pokemonData.pokemon.includes("alola"))
          return true;
      }
      return false;
    case "8":
      if(pokemonData.dex_number > 809 && pokemonData.dex_number <= 905)
        return true;
      else {
        if(pokemonData.pokemon.includes("galar") || pokemonData.pokemon.includes("hisui"))
          return true;
      }
      return false;
    default:
      return true;
  }
}
