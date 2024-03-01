import csv
import simplekml


def read_csv(path, delimiter=','):
    """ Helper function for loading csv data"""
    data = []
    with open(path, 'r') as f:
        for obj in csv.DictReader(f, delimiter=delimiter):
            data.append(obj)
    return data


def build_kml_airport_helper(airport_folder, airport):
    """ Adds airport to KML """
    pt = airport_folder.newpoint(name=airport['IATA'])
    pt.coords = [(airport['LONGITUDE'], airport['LATITUDE'])]
    pt.style.iconstyle.scale = 0.5
    pt.style.iconstyle.icon.href = 'https://maps.google.com/mapfiles/kml/paddle/blu-blank-lv.png'
    pt.style.labelstyle.scale = 0


def build_kml(airports, flights):
    """ Takes airport and flight data and converts to KML file """
    kml = simplekml.Kml()
    kml.document.name = "My Flight Log"
    airport_folder = kml.newfolder(name='Airports')
    found_airports = []

    for flight in flights:
        # add flight line
        ls = kml.newlinestring()
        orig = next(a for a in airports if a['IATA'] == flight['ORIGIN'] and float(
            a['LATITUDE']) != 0)
        dest = next(a for a in airports if a['IATA'] == flight['DESTINATION'] and float(
            a['LATITUDE']) != 0)
        ls.coords = [(orig['LONGITUDE'], orig['LATITUDE']),
                     (dest['LONGITUDE'], dest['LATITUDE'])]

        # add flight name, description, etc
        ls.name = f"{orig['IATA']} ‣ {dest['IATA']} [{flight['DATE']}]"
        ls.description = f'''
            <img src="https://content.airhex.com/content/logos/airlines_{flight['AIRLINE']}_15_15_s.png">
            <b>{flight['AIRLINE']}{flight['FLIGHT']}</b> - {flight['DATE']}<br>
            {orig['CITY']} to {dest['CITY']}
            <hr>
            🛫 {orig['NAME']} - {flight['DEPART']}<br>
            🛬 {dest['NAME']} - {flight['ARRIVE']}<br>
            ⏱️ {flight['TIME']}<br>
            🌎 {flight['DISTANCE']}<br>
            ✈️ {flight['TAIL']} ({flight['TYPE']})
        '''
        ls.style.linestyle.color = simplekml.Color.lightsteelblue
        ls.style.linestyle.width = 4

        # add airport (if not already present)
        for airport in [orig, dest]:
            if airport['IATA'] not in found_airports:
                build_kml_airport_helper(airport_folder, airport)
    return kml


def main():
    airports = read_csv('resources/GlobalAirportDatabase.txt', ':')
    flights = read_csv('resources/MyFlightLog.csv')
    kml = build_kml(airports, flights)
    kml.save('my-flight-log.kml')


if __name__ == '__main__':
    main()
