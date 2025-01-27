import { countries, ICountry } from 'countries-list'

type CountriesList = {
  [key: string]: ICountry;
}

const typedCountries = countries as CountriesList

export const getCountryName = (code: string | null): string => {
  if (!code) return '';
  return typedCountries[code]?.name || code;
};
