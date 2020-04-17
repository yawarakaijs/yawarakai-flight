# yawarakai-musicshare

Part of the Project Yawarakaijs

## Installation
This will add the component into yawarakai instance, you don't need any configuration for this component
```
$ yarn add @yawarakaijs/yawarakai-flight
```

## Development
Edit `config.json` file with the property `development` and set it to true   
Create a directory under yawarakai instance
```
$ mkdir Components && cd Components
```
Directly download this component as archived file and extract out
```
$ wget -L https://github.com/yawarakaijs/yawarakai-flight/archive/master.zip -O yawarakai-flight.zip
$ unzip yawarakai-flight.zip
```

## Available Commands
Search flight info
```
/flight [Flight Number(IND-0000)] [Flight Date(YYYY-MM-DD)]?
```

## Available InlineQueries
Input text with format like [Flight Number(IND-0000)] [Flight Date(YYYY-MM-DD)]