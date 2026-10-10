import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { predictImage } from '../utils/localAI';

const NOMINATIM_URL =
  'https://nominatim.openstreetmap.org/search';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';

type TabName =
  | 'scan'
  | 'history'
  | 'knowledge'
  | 'hospital'
  | 'profile';

type ResultType =
  | 'benign'
  | 'melanoma'
  | 'nevus';

type AIResult = {
  prediction?:
    | 'benign'
    | 'melanoma'
    | 'nevus'
    | string;

  className?: string;
  label?: string;
  confidence?: number;
  class_index?: number;

  probabilities?:
    | number[]
    | {
        benign?: number;
        melanoma?: number;
        nevus?: number;
      };
};

type Hospital = {
  place_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  distance?: number;
};

const MOCK_USER_HISTORY = [
  {
    id: '1',
    date: '30/09/2026',
    result: 'Melanoma',
    confidence: 91.2,
    status: 'ควรพบแพทย์',
  },
  {
    id: '2',
    date: '28/09/2026',
    result: 'Nevus',
    confidence: 88.5,
    status: 'ปกติ',
  },
  {
    id: '3',
    date: '25/09/2026',
    result: 'Benign',
    confidence: 94.1,
    status: 'ปกติ',
  },
];

const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'ABCDE Rule',
    category: 'การตรวจเบื้องต้น',
    content:
      'ABCDE เป็นหลักสังเกตไฝหรือรอยโรคบนผิวหนัง ได้แก่ A - Asymmetry ความไม่สมมาตร, B - Border ขอบไม่เรียบ, C - Color สีไม่สม่ำเสมอ, D - Diameter ขนาด และ E - Evolving การเปลี่ยนแปลงของรอยโรค',
  },
  {
    id: '2',
    title: 'Ugly Duckling Sign',
    category: 'การตรวจเบื้องต้น',
    content:
      'Ugly Duckling Sign คือการสังเกตรอยโรคที่มีลักษณะแตกต่างจากไฝหรือรอยอื่น ๆ ที่อยู่บริเวณเดียวกันอย่างชัดเจน',
  },
  {
    id: '3',
    title: 'Melanoma คืออะไร?',
    category: 'ความรู้',
    content:
      'Melanoma เป็นมะเร็งผิวหนังชนิดหนึ่งที่เกิดจากเซลล์สร้างเม็ดสี การตรวจพบตั้งแต่ระยะแรกสามารถช่วยเพิ่มโอกาสในการรักษาได้',
  },
  {
    id: '4',
    title: 'การป้องกันมะเร็งผิวหนัง',
    category: 'การป้องกัน',
    content:
      'ควรหลีกเลี่ยงแสงแดดจัด ใช้ครีมกันแดดอย่างเหมาะสม สวมเสื้อผ้าที่ป้องกันแสงแดด และตรวจสอบการเปลี่ยนแปลงของไฝเป็นประจำ',
  },
];

export default function App() {
  // =========================
  // AUTH
  // =========================

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [isRegister, setIsRegister] =
    useState(false);

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [registerUsername, setRegisterUsername] =
    useState('');

  const [registerPassword, setRegisterPassword] =
    useState('');

  const [
    registerConfirmPassword,
    setRegisterConfirmPassword,
  ] = useState('');

  const [isAdmin, setIsAdmin] =
    useState(false);

  // =========================
  // MAIN APP
  // =========================

  const [activeTab, setActiveTab] =
    useState<TabName>('scan');

  // =========================
  // PROFILE
  // =========================

  const [profileName, setProfileName] =
    useState('User');

  const [profileEmail, setProfileEmail] =
    useState('user@example.com');

  const [profilePhone, setProfilePhone] =
    useState('');

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [editProfile, setEditProfile] =
    useState(false);

  const [oldPassword, setOldPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState('');

  // =========================
  // AI SCAN
  // =========================

  const [image, setImage] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<AIResult | null>(null);

  // =========================
  // KNOWLEDGE
  // =========================

  const [selectedArticle, setSelectedArticle] =
    useState<
      (typeof MOCK_ARTICLES)[number] | null
    >(null);

  // =========================
  // HOSPITAL / GPS
  // =========================

  const [location, setLocation] =
    useState<Location.LocationObject | null>(
      null
    );

  const [hospitals, setHospitals] =
    useState<Hospital[]>([]);

  const [searchingHospitals, setSearchingHospitals] =
    useState(false);

  // ช่องค้นหาโรงพยาบาล
  const [hospitalSearch, setHospitalSearch] =
    useState('');

  // =========================
  // LOGIN
  // =========================

  const handleLogin = () => {
    const cleanUsername =
      username.trim();

    if (!cleanUsername || !password) {
      Alert.alert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอก Username และ Password'
      );
      return;
    }

    if (
      cleanUsername === ADMIN_USERNAME &&
      password === ADMIN_PASSWORD
    ) {
      setIsAdmin(true);
      setIsLoggedIn(true);
      setProfileName('Administrator');
      setProfileEmail(
        'admin@skinscan.ai'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'เข้าสู่ระบบไม่สำเร็จ',
        'Password ต้องมีอย่างน้อย 6 ตัวอักษร'
      );
      return;
    }

    setIsAdmin(false);
    setIsLoggedIn(true);
    setProfileName(cleanUsername);
    setProfileEmail(
      `${cleanUsername}@example.com`
    );
  };

  // =========================
  // REGISTER
  // =========================

  const handleRegister = () => {
    const cleanUsername =
      registerUsername.trim();

    if (
      !cleanUsername ||
      !registerPassword ||
      !registerConfirmPassword
    ) {
      Alert.alert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอกข้อมูลให้ครบ'
      );
      return;
    }

    if (cleanUsername.length < 3) {
      Alert.alert(
        'Username ไม่ถูกต้อง',
        'Username ต้องมีอย่างน้อย 3 ตัวอักษร'
      );
      return;
    }

    if (registerPassword.length < 6) {
      Alert.alert(
        'Password ไม่ถูกต้อง',
        'Password ต้องมีอย่างน้อย 6 ตัวอักษร'
      );
      return;
    }

    if (
      registerPassword !==
      registerConfirmPassword
    ) {
      Alert.alert(
        'Password ไม่ตรงกัน',
        'กรุณากรอก Password ให้ตรงกัน'
      );
      return;
    }

    Alert.alert(
      'สมัครสมาชิกสำเร็จ',
      'สามารถเข้าสู่ระบบด้วยบัญชีที่สมัครได้',
      [
        {
          text: 'เข้าสู่ระบบ',
          onPress: () => {
            setUsername(cleanUsername);
            setPassword(
              registerPassword
            );
            setIsRegister(false);

            setRegisterUsername('');
            setRegisterPassword('');
            setRegisterConfirmPassword('');
          },
        },
      ]
    );
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    setPassword('');
    setResult(null);
    setImage(null);
    setActiveTab('scan');

    setHospitals([]);
    setHospitalSearch('');
    setLocation(null);
  };

  // =========================
  // CHANGE PROFILE IMAGE
  // =========================

  const changeProfileImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'ไม่ได้รับอนุญาต',
          'กรุณาอนุญาตให้แอปเข้าถึงรูปภาพ'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets?.length > 0
      ) {
        setProfileImage(
          result.assets[0].uri
        );
      }
    } catch (error) {
      console.error(
        '[PROFILE IMAGE] ERROR:',
        error
      );

      Alert.alert(
        'เกิดข้อผิดพลาด',
        error instanceof Error
          ? error.message
          : 'ไม่สามารถเปลี่ยนรูปโปรไฟล์ได้'
      );
    }
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const saveProfile = () => {
    if (!profileName.trim()) {
      Alert.alert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอกชื่อ'
      );
      return;
    }

    if (
      profileEmail.trim() &&
      !profileEmail.includes('@')
    ) {
      Alert.alert(
        'Email ไม่ถูกต้อง',
        'กรุณาตรวจสอบ Email'
      );
      return;
    }

    setEditProfile(false);

    Alert.alert(
      'สำเร็จ',
      'บันทึกข้อมูลโปรไฟล์แล้ว'
    );
  };

  // =========================
  // CHANGE PASSWORD
  // =========================

  const changePassword = () => {
    if (
      !oldPassword ||
      !newPassword ||
      !confirmNewPassword
    ) {
      Alert.alert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอก Password ให้ครบ'
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        'Password ไม่ถูกต้อง',
        'Password ใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
      );
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      Alert.alert(
        'Password ไม่ตรงกัน',
        'กรุณากรอก Password ใหม่ให้ตรงกัน'
      );
      return;
    }

    if (newPassword === oldPassword) {
      Alert.alert(
        'Password ไม่ถูกต้อง',
        'Password ใหม่ต้องแตกต่างจาก Password เดิม'
      );
      return;
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');

    Alert.alert(
      'สำเร็จ',
      'เปลี่ยน Password เรียบร้อยแล้ว'
    );
  };

  // =========================
  // CAMERA
  // =========================

  const takePhoto = async () => {
    console.log(
      '[CAMERA] Requesting permission...'
    );

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      console.log(
        '[CAMERA] Permission:',
        permission
      );

      if (!permission.granted) {
        Alert.alert(
          'ไม่ได้รับอนุญาต',
          'กรุณาอนุญาตให้แอปใช้กล้อง'
        );
        return;
      }

      console.log(
        '[CAMERA] Opening camera...'
      );

      const cameraResult =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });

      console.log(
        '[CAMERA] Camera returned:',
        cameraResult
      );

      if (
        !cameraResult.canceled &&
        cameraResult.assets?.length > 0
      ) {
        const photoUri =
          cameraResult.assets[0].uri;

        console.log(
          '[CAMERA] Photo URI:',
          photoUri
        );

        setImage(photoUri);
        setResult(null);

        console.log(
          '[CAMERA] Image set successfully'
        );
      }
    } catch (error) {
      console.error(
        '[CAMERA] ERROR:',
        error
      );

      Alert.alert(
        'เปิดกล้องไม่สำเร็จ',
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  };

  // =========================
  // PICK IMAGE
  // =========================

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'ไม่ได้รับอนุญาต',
          'กรุณาอนุญาตให้แอปเข้าถึงรูปภาพ'
        );
        return;
      }

      const pickerResult =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !pickerResult.canceled &&
        pickerResult.assets?.length > 0
      ) {
        const selectedUri =
          pickerResult.assets[0].uri;

        setImage(selectedUri);
        setResult(null);

        console.log(
          '[IMAGE PICKER] Selected:',
          selectedUri
        );
      }
    } catch (error) {
      console.error(
        '[IMAGE PICKER] ERROR:',
        error
      );

      Alert.alert(
        'เลือกรูปไม่สำเร็จ',
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  };

  // =========================
  // AI ANALYSIS
  // =========================

  const uploadAndAnalyze = async () => {
    if (!image) {
      Alert.alert(
        'ยังไม่มีรูป',
        'กรุณาถ่ายรูปหรือเลือกรูปก่อน'
      );
      return;
    }

    setLoading(true);
    setResult(null);

    console.log(
      '[AI] Starting prediction:',
      image
    );

    try {
      const data =
        await predictImage(image);

      console.log(
        '[AI] Prediction result:',
        data
      );

      setResult(data);
    } catch (error) {
      console.error(
        'ONNX prediction error:',
        error
      );

      Alert.alert(
        'วิเคราะห์ไม่สำเร็จ',
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการวิเคราะห์ภาพ'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GPS
  // =========================

  const getLocation = async () => {
    try {
      console.log(
        '[GPS] Checking location service...'
      );

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      console.log(
        '[GPS] Location service enabled:',
        servicesEnabled
      );

      if (!servicesEnabled) {
        Alert.alert(
          'GPS ปิดอยู่',
          'กรุณาเปิด Location/GPS ของเครื่องก่อนใช้งานค้นหาโรงพยาบาล'
        );

        return null;
      }

      console.log(
        '[GPS] Requesting foreground permission...'
      );

      const permission =
        await Location.requestForegroundPermissionsAsync();

      console.log(
        '[GPS] Permission:',
        permission.status
      );

      if (
        permission.status !==
        'granted'
      ) {
        Alert.alert(
          'ไม่ได้รับอนุญาต',
          'กรุณาอนุญาตให้ SkinScan AI เข้าถึงตำแหน่งของคุณ'
        );

        return null;
      }

      console.log(
        '[GPS] Getting current position...'
      );

      let currentLocation:
        | Location.LocationObject
        | null = null;

      try {
        currentLocation =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.Balanced,
            }
          );
      } catch (error) {
        console.warn(
          '[GPS] Current position failed:',
          error
        );
      }

      if (!currentLocation) {
        console.log(
          '[GPS] Trying last known position...'
        );

        currentLocation =
          await Location.getLastKnownPositionAsync();
      }

      if (!currentLocation) {
        Alert.alert(
          'ไม่สามารถหาตำแหน่งได้',
          'กรุณาเปิด GPS และลองอีกครั้งในบริเวณที่รับสัญญาณ GPS ได้'
        );

        return null;
      }

      console.log(
        '[GPS] Latitude:',
        currentLocation.coords.latitude
      );

      console.log(
        '[GPS] Longitude:',
        currentLocation.coords.longitude
      );

      setLocation(currentLocation);

      return currentLocation;
    } catch (error) {
      console.error(
        '[LOCATION] ERROR:',
        error
      );

      Alert.alert(
        'ไม่สามารถหาตำแหน่งได้',
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการหาตำแหน่ง'
      );

      return null;
    }
  };

  // =========================
  // DISTANCE
  // =========================

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;

    const dLat =
      ((lat2 - lat1) * Math.PI) /
      180;

    const dLon =
      ((lon2 - lon1) * Math.PI) /
      180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(
        (lat1 * Math.PI) / 180
      ) *
        Math.cos(
          (lat2 * Math.PI) / 180
        ) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  };

  // =========================
  // SEARCH HOSPITAL BY NAME
  // =========================

  const searchHospitals = async (
    currentLocation?: Location.LocationObject
  ) => {
    const searchText =
      hospitalSearch.trim();

    if (!searchText) {
      Alert.alert(
        'กรุณาระบุชื่อโรงพยาบาล',
        'เช่น โรงพยาบาลจุฬาลงกรณ์ หรือ โรงพยาบาลศิริราช'
      );
      return;
    }

    setSearchingHospitals(true);
    setHospitals([]);

    try {
      console.log(
        '[HOSPITAL] Searching:',
        searchText
      );

      let current =
        currentLocation || location;

      if (!current) {
        console.log(
          '[HOSPITAL] No location, getting GPS...'
        );

        current =
          await getLocation();

        if (!current) {
          return;
        }
      }

      const lat =
        current.coords.latitude;

      const lon =
        current.coords.longitude;

      console.log(
        '[HOSPITAL] User location:',
        lat,
        lon
      );

      /*
       * ใช้ชื่อที่ผู้ใช้พิมพ์ค้นหาโดยตรง
       * ไม่ค้นหาโรงพยาบาลทั้งหมด
       */
      const query =
        `${searchText} hospital`;

      const params =
        new URLSearchParams({
          format: 'json',
          q: query,
          limit: '20',
          addressdetails: '1',
          'accept-language': 'th',
        });

      const url =
        `${NOMINATIM_URL}?${params.toString()}`;

      console.log(
        '[HOSPITAL] Nominatim URL:',
        url
      );

      const response =
        await fetch(url, {
          headers: {
            Accept:
              'application/json',
            'User-Agent':
              'SkinScanAI/1.0',
          },
        });

      console.log(
        '[HOSPITAL] HTTP status:',
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        '[HOSPITAL] Raw results:',
        data.length
      );

      const formatted: Hospital[] =
        data
          .map((item: any) => {
            const itemLat =
              parseFloat(item.lat);

            const itemLon =
              parseFloat(item.lon);

            if (
              Number.isNaN(itemLat) ||
              Number.isNaN(itemLon)
            ) {
              return null;
            }

            const distance =
              calculateDistance(
                lat,
                lon,
                itemLat,
                itemLon
              );

            return {
              place_id:
                item.place_id,

              display_name:
                item.display_name,

              lat: item.lat,

              lon: item.lon,

              type: item.type,

              distance,
            };
          })
          .filter(
            (
              item: Hospital | null
            ): item is Hospital =>
              item !== null
          )
          .sort(
            (
              a: Hospital,
              b: Hospital
            ) =>
              (a.distance ??
                Infinity) -
              (b.distance ??
                Infinity)
          );

      console.log(
        '[HOSPITAL] Sorted results:',
        formatted.map(
          (hospital) => ({
            name:
              hospital.display_name
                .split(',')[0],

            distance:
              hospital.distance,
          })
        )
      );

      setHospitals(formatted);

      if (formatted.length === 0) {
        Alert.alert(
          'ไม่พบโรงพยาบาล',
          `ไม่พบ "${searchText}" ลองใช้ชื่อโรงพยาบาลที่ชัดเจนขึ้น`
        );
      }
    } catch (error) {
      console.error(
        '[HOSPITAL] ERROR:',
        error
      );

      Alert.alert(
        'ค้นหาโรงพยาบาลไม่สำเร็จ',
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการค้นหา'
      );
    } finally {
      setSearchingHospitals(false);
    }
  };

  // =========================
  // GOOGLE MAPS
  // =========================

  const openGoogleMaps = async (
    hospital: Hospital
  ) => {
    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${hospital.lat},${hospital.lon}`;

    console.log(
      '[GOOGLE MAPS] Opening:',
      url
    );

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error(
        '[GOOGLE MAPS] ERROR:',
        error
      );

      Alert.alert(
        'ไม่สามารถเปิด Google Maps ได้',
        'กรุณาตรวจสอบว่าเครื่องมีแอป Google Maps'
      );
    }
  };

  // =========================
  // FORMAT DISTANCE
  // =========================

  const formatDistance = (
    distance?: number
  ) => {
    if (distance === undefined) {
      return '-';
    }

    if (distance < 1) {
      return `${Math.round(
        distance * 1000
      )} m`;
    }

    return `${distance.toFixed(2)} km`;
  };

  // =========================
  // HOSPITAL TAB
  // ไม่ค้นหาอัตโนมัติแล้ว
  // =========================

  useEffect(() => {
    if (
      isLoggedIn &&
      activeTab === 'hospital'
    ) {
      console.log(
        '[HOSPITAL] Hospital tab opened'
      );
    }
  }, [
    activeTab,
    isLoggedIn,
  ]);

  // =========================
  // RESULT HELPERS
  // =========================

  const getResultTitle = () => {
    if (!result) {
      return '';
    }

    const prediction =
      result.prediction
        ?.toLowerCase?.() || '';

    if (
      prediction === 'melanoma'
    ) {
      return 'Melanoma';
    }

    if (
      prediction === 'nevus'
    ) {
      return 'Nevus';
    }

    if (
      prediction === 'benign'
    ) {
      return 'Benign';
    }

    if (
      typeof result.class_index ===
      'number'
    ) {
      if (
        result.class_index === 0
      ) {
        return 'Benign';
      }

      if (
        result.class_index === 1
      ) {
        return 'Melanoma';
      }

      if (
        result.class_index === 2
      ) {
        return 'Nevus';
      }
    }

    const label =
      result.className ||
      result.label ||
      '';

    const normalized =
      label.toLowerCase();

    if (
      normalized.includes(
        'melanoma'
      )
    ) {
      return 'Melanoma';
    }

    if (
      normalized.includes(
        'nevus'
      )
    ) {
      return 'Nevus';
    }

    if (
      normalized.includes(
        'benign'
      )
    ) {
      return 'Benign';
    }

    return label || 'Unknown';
  };

  const getResultDescription =
    () => {
      const title =
        getResultTitle();

      if (
        title === 'Melanoma'
      ) {
        return 'ผลการวิเคราะห์มีความเป็นไปได้ว่าเป็น Melanoma ควรพบแพทย์ผิวหนังเพื่อประเมินเพิ่มเติม';
      }

      if (
        title === 'Nevus'
      ) {
        return 'ผลการวิเคราะห์มีความเป็นไปได้ว่าเป็น Nevus หรือไฝทั่วไป แต่ควรติดตามการเปลี่ยนแปลงของรอยโรค';
      }

      if (
        title === 'Benign'
      ) {
        return 'ผลการวิเคราะห์มีความเป็นไปได้ว่าเป็นรอยโรคชนิดไม่ร้ายแรง';
      }

      return 'ผลการวิเคราะห์จากโมเดล AI';
    };

  // =========================
  // LOGIN SCREEN
  // =========================

  if (!isLoggedIn) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.authContainer
            }
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={
                styles.logoCircle
              }
            >
              <Text
                style={
                  styles.logoText
                }
              >
                AI
              </Text>
            </View>

            <Text
              style={
                styles.appTitle
              }
            >
              SkinScan AI
            </Text>

            <Text
              style={
                styles.appSubtitle
              }
            >
              ระบบช่วยคัดกรองรอยโรคบนผิวหนัง
            </Text>

            {!isRegister ? (
              <>
                <View
                  style={
                    styles.card
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    เข้าสู่ระบบ
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    placeholder="Username"
                    value={
                      username
                    }
                    onChangeText={
                      setUsername
                    }
                    autoCapitalize="none"
                  />

                  <TextInput
                    style={
                      styles.input
                    }
                    placeholder="Password"
                    value={
                      password
                    }
                    onChangeText={
                      setPassword
                    }
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={
                      styles.primaryButton
                    }
                    onPress={
                      handleLogin
                    }
                  >
                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      เข้าสู่ระบบ
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setIsRegister(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.linkText
                      }
                    >
                      ยังไม่มีบัญชี?
                      สมัครสมาชิก
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View
                style={
                  styles.card
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  สมัครสมาชิก
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Username"
                  value={
                    registerUsername
                  }
                  onChangeText={
                    setRegisterUsername
                  }
                  autoCapitalize="none"
                />

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Password"
                  value={
                    registerPassword
                  }
                  onChangeText={
                    setRegisterPassword
                  }
                  secureTextEntry
                  autoCapitalize="none"
                />

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="ยืนยัน Password"
                  value={
                    registerConfirmPassword
                  }
                  onChangeText={
                    setRegisterConfirmPassword
                  }
                  secureTextEntry
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={
                    styles.primaryButton
                  }
                  onPress={
                    handleRegister
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    สมัครสมาชิก
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setIsRegister(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.linkText
                    }
                  >
                    มีบัญชีอยู่แล้ว?
                    เข้าสู่ระบบ
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =========================
  // MAIN APP
  // =========================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={
              styles.headerTitle
            }
          >
            SkinScan AI
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            {isAdmin
              ? 'Administrator'
              : `สวัสดี ${profileName}`}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.logoutButton
          }
          onPress={logout}
        >
          <Text
            style={
              styles.logoutButtonText
            }
          >
            ออก
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.content}
      >
        {/* ================= SCAN ================= */}

        {activeTab === 'scan' && (
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              AI Skin Scan
            </Text>

            <Text
              style={
                styles.pageDescription
              }
            >
              ถ่ายรูปหรือเลือกรูปภาพรอยโรค
              เพื่อวิเคราะห์ด้วย AI
            </Text>

            <View
              style={
                styles.imageCard
              }
            >
              {image ? (
                <Image
                  source={{
                    uri: image,
                  }}
                  style={
                    styles.previewImage
                  }
                />
              ) : (
                <View
                  style={
                    styles.emptyImage
                  }
                >
                  <Text
                    style={
                      styles.emptyImageText
                    }
                  >
                    ยังไม่มีรูปภาพ
                  </Text>
                </View>
              )}
            </View>

            <View
              style={styles.row}
            >
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.halfButton,
                ]}
                onPress={
                  takePhoto
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  📷 ถ่ายรูป
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  styles.halfButton,
                ]}
                onPress={
                  pickImage
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  🖼️ เลือกรูป
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !image &&
                  styles.disabledButton,
              ]}
              onPress={
                uploadAndAnalyze
              }
              disabled={
                !image || loading
              }
            >
              {loading ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  วิเคราะห์ภาพ
                </Text>
              )}
            </TouchableOpacity>

            {result && (
              <View
                style={
                  styles.resultCard
                }
              >
                <Text
                  style={
                    styles.resultTitle
                  }
                >
                  ผลการวิเคราะห์
                </Text>

                <Text
                  style={
                    styles.resultClass
                  }
                >
                  {getResultTitle()}
                </Text>

                {typeof result.confidence ===
                  'number' && (
                  <Text
                    style={
                      styles.confidenceText
                    }
                  >
                    Confidence:{' '}
                    {(
                      result.confidence >
                      1
                        ? result.confidence
                        : result.confidence *
                          100
                    ).toFixed(2)}
                    %
                  </Text>
                )}

                <Text
                  style={
                    styles.resultDescription
                  }
                >
                  {getResultDescription()}
                </Text>

                <Text
                  style={
                    styles.disclaimer
                  }
                >
                  * ผลลัพธ์จาก AI
                  ใช้สำหรับการคัดกรองเบื้องต้น
                  ไม่สามารถใช้แทนการวินิจฉัยจากแพทย์ได้
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* ================= HISTORY ================= */}

        {activeTab === 'history' && (
          <FlatList
            data={
              MOCK_USER_HISTORY
            }
            keyExtractor={(item) =>
              item.id
            }
            contentContainerStyle={
              styles.scrollContent
            }
            ListHeaderComponent={
              <View>
                <Text
                  style={
                    styles.pageTitle
                  }
                >
                  ประวัติการตรวจ
                </Text>

                <Text
                  style={
                    styles.pageDescription
                  }
                >
                  ประวัติผลการวิเคราะห์ที่ผ่านมา
                </Text>
              </View>
            }
            renderItem={({
              item,
            }) => (
              <View
                style={
                  styles.historyCard
                }
              >
                <View
                  style={
                    styles.historyHeader
                  }
                >
                  <Text
                    style={
                      styles.historyResult
                    }
                  >
                    {item.result}
                  </Text>

                  <Text
                    style={
                      styles.historyDate
                    }
                  >
                    {item.date}
                  </Text>
                </View>

                <Text
                  style={
                    styles.historyConfidence
                  }
                >
                  Confidence:{' '}
                  {item.confidence}%
                </Text>

                <Text
                  style={
                    styles.historyStatus
                  }
                >
                  {item.status}
                </Text>
              </View>
            )}
          />
        )}

        {/* ================= KNOWLEDGE ================= */}

        {activeTab ===
          'knowledge' && (
          <FlatList
            data={
              MOCK_ARTICLES
            }
            keyExtractor={(item) =>
              item.id
            }
            contentContainerStyle={
              styles.scrollContent
            }
            ListHeaderComponent={
              <View>
                <Text
                  style={
                    styles.pageTitle
                  }
                >
                  Knowledge
                </Text>

                <Text
                  style={
                    styles.pageDescription
                  }
                >
                  ความรู้เกี่ยวกับการตรวจสอบผิวหนัง
                </Text>
              </View>
            }
            renderItem={({
              item,
            }) => (
              <TouchableOpacity
                style={
                  styles.articleCard
                }
                onPress={() =>
                  setSelectedArticle(
                    item
                  )
                }
              >
                <Text
                  style={
                    styles.articleCategory
                  }
                >
                  {item.category}
                </Text>

                <Text
                  style={
                    styles.articleTitle
                  }
                >
                  {item.title}
                </Text>

                <Text
                  style={
                    styles.articlePreview
                  }
                  numberOfLines={
                    2
                  }
                >
                  {item.content}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* ================= HOSPITAL ================= */}

        {activeTab ===
          'hospital' && (
          <View
            style={{
              flex: 1,
            }}
          >
            <ScrollView
              contentContainerStyle={
                styles.scrollContent
              }
              keyboardShouldPersistTaps="handled"
            >
              <Text
                style={
                  styles.pageTitle
                }
              >
                ค้นหาโรงพยาบาล
              </Text>

              <Text
                style={
                  styles.pageDescription
                }
              >
                ค้นหาโรงพยาบาลที่ต้องการ
                และดูระยะทางจากตำแหน่งปัจจุบัน
              </Text>

              {/* GPS */}

              <TouchableOpacity
                style={
                  styles.secondaryButton
                }
                onPress={
                  getLocation
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  📍 ใช้ตำแหน่งปัจจุบัน
                </Text>
              </TouchableOpacity>

              {location && (
                <View
                  style={
                    styles.locationCard
                  }
                >
                  <Text
                    style={
                      styles.locationTitle
                    }
                  >
                    ตำแหน่งปัจจุบัน
                  </Text>

                  <Text
                    style={
                      styles.locationText
                    }
                  >
                    Latitude:{' '}
                    {location.coords.latitude.toFixed(
                      6
                    )}
                  </Text>

                  <Text
                    style={
                      styles.locationText
                    }
                  >
                    Longitude:{' '}
                    {location.coords.longitude.toFixed(
                      6
                    )}
                  </Text>
                </View>
              )}

              {/* SEARCH INPUT */}

              <Text
                style={
                  styles.label
                }
              >
                ชื่อโรงพยาบาล
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="เช่น โรงพยาบาลจุฬาลงกรณ์"
                value={
                  hospitalSearch
                }
                onChangeText={(
                  text
                ) => {
                  setHospitalSearch(
                    text
                  );

                  // เคลียร์ผลเก่าเมื่อเปลี่ยนคำค้น
                  setHospitals([]);
                }}
                onSubmitEditing={() =>
                  searchHospitals()
                }
                returnKeyType="search"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={() =>
                  searchHospitals()
                }
                disabled={
                  searchingHospitals
                }
              >
                {searchingHospitals ? (
                  <ActivityIndicator
                    color="#112491"
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    🔍 ค้นหาโรงพยาบาล
                  </Text>
                )}
              </TouchableOpacity>

              {searchingHospitals && (
                <ActivityIndicator
                  size="large"
                  style={{
                    marginVertical: 20,
                  }}
                />
              )}

              {/* SEARCH RESULTS */}

              {hospitals.length > 0 && (
                <Text
                  style={
                    styles.searchResultTitle
                  }
                >
                  ผลการค้นหา
                </Text>
              )}

              {hospitals.map(
                (
                  hospital,
                  index
                ) => (
                  <View
                    key={
                      hospital.place_id?.toString() ||
                      `${hospital.lat}-${hospital.lon}-${index}`
                    }
                    style={
                      styles.hospitalCard
                    }
                  >
                    <Text
                      style={
                        styles.hospitalName
                      }
                    >
                      {hospital.display_name
                        .split(
                          ','
                        )[0]
                        .trim()}
                    </Text>

                    <Text
                      style={
                        styles.hospitalAddress
                      }
                    >
                      {
                        hospital.display_name
                      }
                    </Text>

                    <Text
                      style={
                        styles.distanceText
                      }
                    >
                      ระยะทางจากคุณ:{' '}
                      {formatDistance(
                        hospital.distance
                      )}
                    </Text>

                    <TouchableOpacity
                      style={
                        styles.mapButton
                      }
                      onPress={() =>
                        openGoogleMaps(
                          hospital
                        )
                      }
                    >
                      <Text
                        style={
                          styles.mapButtonText
                        }
                      >
                        🗺️ เปิด Google Maps
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        )}

        {/* ================= PROFILE ================= */}

        {activeTab ===
          'profile' && (
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              Profile
            </Text>

            <TouchableOpacity
              style={
                styles.profileImageContainer
              }
              onPress={
                changeProfileImage
              }
            >
              {profileImage ? (
                <Image
                  source={{
                    uri: profileImage,
                  }}
                  style={
                    styles.profileImage
                  }
                />
              ) : (
                <View
                  style={
                    styles.profilePlaceholder
                  }
                >
                  <Text
                    style={
                      styles.profilePlaceholderText
                    }
                  >
                    {profileName
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text
              style={
                styles.changePhotoText
              }
            >
              แตะเพื่อเปลี่ยนรูป
            </Text>

            <View
              style={
                styles.card
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                ข้อมูลส่วนตัว
              </Text>

              <Text
                style={
                  styles.label
                }
              >
                ชื่อ
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={
                  profileName
                }
                onChangeText={
                  setProfileName
                }
                editable={
                  editProfile
                }
              />

              <Text
                style={
                  styles.label
                }
              >
                Email
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={
                  profileEmail
                }
                onChangeText={
                  setProfileEmail
                }
                editable={
                  editProfile
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text
                style={
                  styles.label
                }
              >
                เบอร์โทรศัพท์
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={
                  profilePhone
                }
                onChangeText={
                  setProfilePhone
                }
                editable={
                  editProfile
                }
                keyboardType="phone-pad"
              />

              {!editProfile ? (
                <TouchableOpacity
                  style={
                    styles.secondaryButton
                  }
                  onPress={() =>
                    setEditProfile(
                      true
                    )
                  }
                >
                  <Text
                    style={
                      styles.secondaryButtonText
                    }
                  >
                    แก้ไขข้อมูล
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={
                    styles.primaryButton
                  }
                  onPress={
                    saveProfile
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    บันทึกข้อมูล
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {!isAdmin && (
              <View
                style={
                  styles.card
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  เปลี่ยน Password
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Password เดิม"
                  value={
                    oldPassword
                  }
                  onChangeText={
                    setOldPassword
                  }
                  secureTextEntry
                />

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Password ใหม่"
                  value={
                    newPassword
                  }
                  onChangeText={
                    setNewPassword
                  }
                  secureTextEntry
                />

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="ยืนยัน Password ใหม่"
                  value={
                    confirmNewPassword
                  }
                  onChangeText={
                    setConfirmNewPassword
                  }
                  secureTextEntry
                />

                <TouchableOpacity
                  style={
                    styles.primaryButton
                  }
                  onPress={
                    changePassword
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    เปลี่ยน Password
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={
                styles.dangerButton
              }
              onPress={
                logout
              }
            >
              <Text
                style={
                  styles.dangerButtonText
                }
              >
                ออกจากระบบ
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ================= TAB BAR ================= */}

      <View
        style={styles.tabBar}
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            setActiveTab('scan')
          }
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === 'scan' &&
                styles.activeTabText,
            ]}
          >
            🔍
          </Text>

          <Text
            style={[
              styles.tabText,
              activeTab === 'scan' &&
                styles.activeTabText,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            setActiveTab('history')
          }
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab ===
                'history' &&
                styles.activeTabText,
            ]}
          >
            📋
          </Text>

          <Text
            style={[
              styles.tabText,
              activeTab ===
                'history' &&
                styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            setActiveTab(
              'knowledge'
            )
          }
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab ===
                'knowledge' &&
                styles.activeTabText,
            ]}
          >
            📚
          </Text>

          <Text
            style={[
              styles.tabText,
              activeTab ===
                'knowledge' &&
                styles.activeTabText,
            ]}
          >
            Knowledge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            setActiveTab(
              'hospital'
            )
          }
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab ===
                'hospital' &&
                styles.activeTabText,
            ]}
          >
            🏥
          </Text>

          <Text
            style={[
              styles.tabText,
              activeTab ===
                'hospital' &&
                styles.activeTabText,
            ]}
          >
            Hospital
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() =>
            setActiveTab('profile')
          }
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab ===
                'profile' &&
                styles.activeTabText,
            ]}
          >
            👤
          </Text>

          <Text
            style={[
              styles.tabText,
              activeTab ===
                'profile' &&
                styles.activeTabText,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= KNOWLEDGE MODAL ================= */}

      <Modal
        visible={
          selectedArticle !== null
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setSelectedArticle(
            null
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContainer
            }
          >
            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setSelectedArticle(
                  null
                )
              }
            >
              <Text
                style={
                  styles.closeButtonText
                }
              >
                ✕
              </Text>
            </TouchableOpacity>

            {selectedArticle && (
              <ScrollView>
                <Text
                  style={
                    styles.articleCategory
                  }
                >
                  {
                    selectedArticle.category
                  }
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    selectedArticle.title
                  }
                </Text>

                <Text
                  style={
                    styles.modalContent
                  }
                >
                  {
                    selectedArticle.content
                  }
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2563eb',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  logoText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },

  appTitle: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },

  appSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 24,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  input: {
    backgroundColor: '#99aede6d',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#111827',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },

  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: '#e8eefc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  secondaryButtonText: {
    color: '#1d4ed8',
    fontSize: 15,
    fontWeight: '700',
  },

  dangerButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 30,
  },

  dangerButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },

  linkText: {
    textAlign: 'center',
    color: '#2563eb',
    marginTop: 8,
    fontWeight: '600',
  },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
  },

  headerSubtitle: {
    color: '#6b7280',
    marginTop: 2,
  },

  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 30,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },

  pageDescription: {
    color: '#6b7280',
    marginBottom: 18,
    lineHeight: 20,
  },

  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    minHeight: 280,
    elevation: 2,
  },

  previewImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },

  emptyImage: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },

  emptyImageText: {
    color: '#6b7280',
    fontSize: 16,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  halfButton: {
    flex: 1,
  },

  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    elevation: 2,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  resultClass: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: 8,
  },

  confidenceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
  },

  resultDescription: {
    color: '#374151',
    lineHeight: 22,
    marginTop: 12,
  },

  disclaimer: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },

  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  historyResult: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  historyDate: {
    color: '#6b7280',
  },

  historyConfidence: {
    color: '#374151',
    marginBottom: 5,
  },

  historyStatus: {
    color: '#16a34a',
    fontWeight: '600',
  },

  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },

  articleCategory: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },

  articleTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  articlePreview: {
    color: '#6b7280',
    lineHeight: 20,
  },

  locationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },

  locationTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },

  locationText: {
    color: '#4b5563',
    marginBottom: 4,
  },

  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },

  hospitalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  hospitalAddress: {
    color: '#6b7280',
    lineHeight: 19,
    marginTop: 5,
  },

  distanceText: {
    color: '#2563eb',
    fontWeight: '700',
    marginTop: 8,
  },

  mapButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
  },

  mapButtonText: {
    color: '#0f0e0e',
    fontWeight: '700',
  },

  searchResultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 12,
  },

  profileImageContainer: {
    alignSelf: 'center',
    marginTop: 10,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  profilePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profilePlaceholderText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
  },

  changePhotoText: {
    textAlign: 'center',
    color: '#2563eb',
    marginTop: 8,
    marginBottom: 18,
  },

  tabBar: {
    height: 68,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabIcon: {
    fontSize: 19,
    marginBottom: 3,
  },

  tabText: {
    fontSize: 11,
    color: '#6b7280',
  },

  activeTabText: {
    color: '#2563eb',
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '80%',
    padding: 22,
  },

  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  closeButtonText: {
    fontSize: 18,
    color: '#374151',
  },

  modalTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },

  modalContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
    paddingBottom: 30,
  },
});