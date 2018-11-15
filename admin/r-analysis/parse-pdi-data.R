# libs
library(dplyr)
library(readr)
library(ggplot2)
library(lubridate)
library(tidyr)

# lookups
lookup_state_codes <- read_tsv("lookup/state-codes.tsv", col_names = c("state_code", "state_name"))
leap_years <- c(1896, 1904, 1908, 1912, 1916, 1920, 1924, 1928, 1932, 1936, 1940, 1944, 1948, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2016)

# read data
df <- read_table("https://www1.ncdc.noaa.gov/pub/data/cirs/climdiv/climdiv-pcpnst-v1.0.0-20181105", col_names = c("id", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec")) %>%
  mutate(
    state_code = substr(id, 1, 3),
    division_number = substr(id, 4, 4),
    element_code = substr(id, 5, 6),
    year = substr(id, 7, 10),
    nov = ifelse(nov < 0, 0, nov),
    dec = ifelse(dec < 0, 0, dec)
  ) %>%
  left_join(
    lookup_state_codes, by = "state_code"
  )

df_calif <- df %>% filter(state_name == "California")

df_calif_oct <- df %>%
  filter(state_name == "California") %>%
  mutate(precip = oct) %>%
  select(state_name, year, precip)

df_calif_oct_sep <- df %>%
  filter(state_name == "California") %>%
  mutate(precip = ((oct * 31) + (sep * 30)) / 61) %>%
  select(state_name, year, precip)

df_calif_annual_thru_oct <- df %>%
  filter(state_name == "California") %>%
  mutate(
    precip = (
      (jan * 31) +
      (feb * ifelse(year %in% leap_years, 29, 28)) +
      (mar * 31) +
      (apr * 30) +
      (may * 31) +
      (jun * 30) +
      (jul * 31) +
      (aug * 31) +
      (sep * 30) +
      (oct * 31)
      ) / 
      (ifelse(year %in% leap_years, 305, 304)
    )
  ) %>%
  select(state_name, year, precip)

plot <- ggplot(
  data = filter(df_calif_annual_thru_oct, year > 1899),
  mapping = aes(
    x = ymd(paste0(year, "0101")),
    y = precip
  )
)

plot + geom_point() + geom_smooth(method = "loess")