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
df <- read_table("https://www1.ncdc.noaa.gov/pub/data/cirs/climdiv/climdiv-tmpcst-v1.0.0-20181105", col_names = c("id", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec")) %>%
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
  mutate(temp = oct) %>%
  select(state_name, year, temp)

df_calif_oct_sep <- df %>%
  filter(state_name == "California") %>%
  mutate(temp = ((oct * 31) + (sep * 30)) / 61) %>%
  select(state_name, year, temp)

df_calif_annual_thru_oct <- df %>%
  filter(state_name == "California") %>%
  mutate(
    temp = (
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
  select(state_name, year, temp)

plot <- ggplot(
  data = filter(df_calif_annual_thru_oct, year > 1899),
  mapping = aes(
    x = ymd(paste0(year, "0101")),
    y = temp
  )
)

plot + geom_point() + geom_smooth(method = "loess")

df_jan <- df %>%
  mutate(month = "01") %>%
  select(state_name, year, month, temp = jan)

df_feb <- df %>%
  mutate(month = "02") %>%
  select(state_name, year, month, temp = feb)

df_mar <- df %>%
  mutate(month = "03") %>%
  select(state_name, year, month, temp = mar)

df_apr <- df %>%
  mutate(month = "04") %>%
  select(state_name, year, month, temp = apr)

df_may <- df %>%
  mutate(month = "05") %>%
  select(state_name, year, month, temp = may)

df_jun <- df %>%
  mutate(month = "06") %>%
  select(state_name, year, month, temp = jun)

df_jul <- df %>%
  mutate(month = "07") %>%
  select(state_name, year, month, temp = jul)

df_aug <- df %>%
  mutate(month = "08") %>%
  select(state_name, year, month, temp = aug)

df_sep <- df %>%
  mutate(month = "09") %>%
  select(state_name, year, month, temp = sep)

df_oct <- df %>%
  mutate(month = "10") %>%
  select(state_name, year, month, temp = oct)

df_nov <- df %>%
  mutate(month = "11") %>%
  select(state_name, year, month, temp = nov)

df_dec <- df %>%
  mutate(month = "12") %>%
  select(state_name, year, month, temp = dec)

df_spread <- bind_rows(df_jan, df_feb, df_mar, df_apr, df_may, df_jun, df_jul, df_aug, df_sep, df_oct, df_nov, df_dec) %>%
  mutate(datetime = ymd(paste0(year, month, "01")))