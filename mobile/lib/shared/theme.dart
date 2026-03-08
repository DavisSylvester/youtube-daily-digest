import 'package:flutter/material.dart';

const Color kPrimaryRed = Color(0xFFDC3545);
const Color kBackground = Color(0xFFF8F9FA);
const Color kSuccessGreen = Color(0xFF28A745);
const Color kWarningYellow = Color(0xFFFFC107);
const Color kDangerRed = Color(0xFFDC3545);
const Color kMutedGray = Color(0xFF6C757D);

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kPrimaryRed,
      brightness: Brightness.light,
    ).copyWith(
      primary: kPrimaryRed,
      surface: kBackground,
    ),
    scaffoldBackgroundColor: kBackground,
    appBarTheme: const AppBarTheme(
      backgroundColor: kPrimaryRed,
      foregroundColor: Colors.white,
      elevation: 2,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      color: Colors.white,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kPrimaryRed,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      isDense: true,
    ),
    chipTheme: const ChipThemeData(
      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor: kPrimaryRed,
      unselectedItemColor: kMutedGray,
      backgroundColor: Colors.white,
      elevation: 8,
    ),
  );
}
