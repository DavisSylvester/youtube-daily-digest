import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

const String kApiBaseUrl = 'http://10.0.2.2:3101/api/v1';

Dio createDioClient() {
  final dio = Dio(
    BaseOptions(
      baseUrl: kApiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  if (kDebugMode) {
    dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => debugPrint(obj.toString()),
      ),
    );
  }

  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (DioException error, ErrorInterceptorHandler handler) {
        debugPrint('API Error [${error.response?.statusCode}]: ${error.message}');
        handler.next(error);
      },
    ),
  );

  return dio;
}
