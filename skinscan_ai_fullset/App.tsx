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

// =====================================================
// LOCAL AI
// =====================================================

import { predictImage } from './localAI';

// =====================================================
// API
// =====================================================

// Nominatim ใช้สำหรับค้นหาโรงพยาบาล
const NOMINATIM_URL =
  'https://nominatim.openstreetmap.org/search';

// =====================================================
// DEMO ADMIN ACCOUNT
// =====================================================

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// =====================================================
// MOCK HISTORY
// =====================================================

const MOCK_USER_HISTORY = [
  {
    id: '1',
    date: '01/10/2026',
    prediction: 'Melanoma (มะเร็งผิวหนัง)',
    risk: 'Urgent',
    confidence: 0.93,
  },
  {
    id: '2',
    date: '15/08/2026',
    prediction: 'Melanocytic Nevi (ไฝธรรมดา)',
    risk: 'Normal',
    confidence: 0.89,
  },
];

// =====================================================
// KNOWLEDGE
// =====================================================

const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'สังเกตรอยโรคด้วยหลัก ABCDE',
    desc:
      'A=ไม่สมมาตร, B=ขอบไม่ชัด, C=สีไม่สม่ำเสมอ, D=ขนาดใหญ่กว่า 6มม., E=มีการเปลี่ยนแปลง',
    content:
      'หลัก ABCDE เป็นวิธีตรวจคัดกรองมะเร็งผิวหนังชนิด Melanoma เบื้องต้นด้วยตนเอง\n\n' +
      'A - Asymmetry (ความไม่สมมาตร): ไฝปกติมักมีรูปร่างกลมสมมาตร\n\n' +
      'B - Border (ขอบเขต): ขอบของไฝหรือรอยโรคไม่เรียบ หยัก หรือเบลอ\n\n' +
      'C - Color (สี): มีหลายสีปนกัน เช่น น้ำตาล ดำ แดง ขาว\n\n' +
      'D - Diameter (ขนาด): ขนาดใหญ่กว่า 6 มิลลิเมตร\n\n' +
      'E - Evolving (การเปลี่ยนแปลง): รูปร่าง ขนาด หรือสี เปลี่ยนแปลงไปจากเดิม',
  },
  {
    id: '2',
    title: 'ไฝปกติ vs ไฝอันตราย',
    desc:
      'ไฝปกติมักมีสีเดียว ขอบเรียบ และขนาดไม่โตขึ้น หากพบจุดดำที่โตเร็ว มีเลือดออก ควรรีบพบแพทย์',
    content:
      'ไฝปกติ (Common Mole) มักเป็นจุดสีชมพู น้ำตาลอ่อน หรือน้ำตาลเข้ม มีสีสม่ำเสมอ ขอบเรียบชัดเจน และมักมีขนาดเล็กกว่า 6 มม.\n\n' +
      'ส่วนไฝอันตรายอาจมีการเติบโตที่ผิดปกติ เช่น โตขึ้นอย่างรวดเร็ว มีลักษณะนูนขึ้นมา มีเลือดออก มีอาการคัน หรือเจ็บ\n\n' +
      'หากพบอาการเหล่านี้ควรพบแพทย์เพื่อประเมินเพิ่มเติม',
  },
  {
    id: '3',
    title: 'การสังเกต "สี" ของไฝ (Color)',
    desc:
      'ไฝที่ปกติมักมีสีที่สม่ำเสมอ แต่หากไฝมีหลายสีปนกันในเม็ดเดียว ถือเป็นสัญญาณที่ควรสังเกต',
    content:
      'สีเป็นหนึ่งในสัญญาณเตือนที่สำคัญ ไฝที่ปกติจะมีสีค่อนข้างสม่ำเสมอทั่วทั้งเม็ด\n\n' +
      'หากพบหลายเฉดสีปะปนกัน เช่น น้ำตาลเข้ม ดำ แดง ขาว หรือน้ำเงิน ควรสังเกตการเปลี่ยนแปลงและปรึกษาแพทย์หากมีความผิดปกติ',
  },
  {
    id: '4',
    title: 'ทฤษฎีลูกเป็ดขี้เหร่ (Ugly Duckling Sign)',
    desc:
      'รอยโรคที่ดูแตกต่างจากไฝเม็ดอื่น ๆ บนร่างกายอย่างชัดเจนควรได้รับการสังเกต',
    content:
      'แนวคิด "ลูกเป็ดขี้เหร่" อาศัยหลักการที่ว่าไฝปกติในร่างกายของคนคนหนึ่งมักมีลักษณะคล้ายกัน\n\n' +
      'ถ้ามีไฝเม็ดใดเม็ดหนึ่งที่แตกต่างอย่างชัดเจน เช่น ใหญ่กว่าเพื่อน ดำกว่าเพื่อน หรือรูปร่างแปลกกว่า ควรสังเกตและปรึกษาแพทย์หากมีการเปลี่ยนแปลง',
  },
];

// =====================================================
// APP
// =====================================================

export default function App() {
  // ===================================================
  // LOGIN / REGISTER
  // ===================================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] =
    useState('');

  const [registeredUsername, setRegisteredUsername] =
    useState('');

  const [registeredPassword, setRegisteredPassword] =
    useState('');

  // ===================================================
  // PROFILE
  // ===================================================

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const [editingProfile, setEditingProfile] =
    useState(false);

  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  const [showChangePassword, setShowChangePassword] =
    useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] =
    useState('');

  // ===================================================
  // TABS
  // ===================================================

  const [activeTab, setActiveTab] = useState<
    'scan' | 'history' | 'knowledge' | 'hospital' | 'profile'
  >('scan');

  // ===================================================
  // AI
  // ===================================================

  const [image, setImage] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<any>(null);

  const [loading, setLoading] = useState(false);

  // ===================================================
  // KNOWLEDGE MODAL
  // ===================================================

  const [selectedArticle, setSelectedArticle] =
    useState<any>(null);

  // ===================================================
  // GPS / HOSPITAL
  // ===================================================

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [hospitals, setHospitals] =
    useState<any[]>([]);

  const [hospitalLoading, setHospitalLoading] =
    useState(false);

  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin = () => {
    if (
      username.trim() === '' ||
      password === ''
    ) {
      Alert.alert(
        'ข้อผิดพลาด',
        'กรุณากรอก Username และ Password'
      );
      return;
    }

    // =================================================
    // ADMIN
    // =================================================

    if (
      username.trim().toLowerCase() ===
        ADMIN_USERNAME &&
      password === ADMIN_PASSWORD
    ) {
      setIsAdmin(true);
      setIsLoggedIn(true);
      setPassword('');
      setActiveTab('scan');
      return;
    }

    // =================================================
    // USER
    // =================================================

    if (
      registeredUsername === '' ||
      registeredPassword === ''
    ) {
      Alert.alert(
        'ยังไม่มีบัญชี',
        'กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ'
      );
      return;
    }

    if (
      username.trim() !==
      registeredUsername
    ) {
      Alert.alert(
        'เข้าสู่ระบบไม่สำเร็จ',
        'Username ไม่ถูกต้อง'
      );
      return;
    }

    if (
      password !==
      registeredPassword
    ) {
      Alert.alert(
        'เข้าสู่ระบบไม่สำเร็จ',
        'Password ไม่ถูกต้อง'
      );
      return;
    }

    setIsAdmin(false);
    setIsLoggedIn(true);
    setPassword('');
    setActiveTab('scan');
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);

    setUsername('');
    setPassword('');

    setImage(null);
    setResult(null);

    setActiveTab('scan');
  };

  // ===================================================
  // REGISTER
  // ===================================================

  const handleRegister = () => {
    if (
      regUsername.trim() === '' ||
      regEmail.trim() === '' ||
      regPassword === '' ||
      regConfirmPassword === ''
    ) {
      Alert.alert(
        'ข้อผิดพลาด',
        'กรุณากรอกข้อมูลให้ครบถ้วน'
      );
      return;
    }

    if (
      regUsername
        .trim()
        .toLowerCase() ===
      ADMIN_USERNAME
    ) {
      Alert.alert(
        'สมัครสมาชิกไม่สำเร็จ',
        'Username นี้สงวนไว้สำหรับ Admin'
      );
      return;
    }

    if (regPassword.length < 6) {
      Alert.alert(
        'ข้อผิดพลาด',
        'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      );
      return;
    }

    if (
      regPassword !==
      regConfirmPassword
    ) {
      Alert.alert(
        'ข้อผิดพลาด',
        'รหัสผ่านไม่ตรงกัน'
      );
      return;
    }

    if (
      registeredUsername !== '' &&
      regUsername.trim() ===
        registeredUsername
    ) {
      Alert.alert(
        'สมัครสมาชิกไม่สำเร็จ',
        'Username นี้มีอยู่แล้ว'
      );
      return;
    }

    setRegisteredUsername(
      regUsername.trim()
    );

    setRegisteredPassword(
      regPassword
    );

    Alert.alert(
      'สมัครสมาชิกสำเร็จ',
      'สามารถเข้าสู่ระบบได้แล้ว',
      [
        {
          text: 'เข้าสู่ระบบ',

          onPress: () => {
            setUsername(
              regUsername.trim()
            );

            setPassword('');

            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            setRegConfirmPassword('');

            setIsRegistering(false);
          },
        },
      ]
    );
  };

  // ===================================================
  // CHANGE PROFILE IMAGE
  // ===================================================

  const changeProfileImage =
    async () => {
      const permissionResult =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (
        !permissionResult.granted
      ) {
        Alert.alert(
          'สิทธิ์ถูกปฏิเสธ',
          'คุณต้องอนุญาตให้เข้าถึงคลังภาพ'
        );
        return;
      }

      const pickerResult =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsEditing: true,

            aspect: [1, 1],

            quality: 0.8,
          }
        );

      if (
        !pickerResult.canceled
      ) {
        setProfileImage(
          pickerResult.assets[0].uri
        );
      }
    };

  // ===================================================
  // SAVE PROFILE
  // ===================================================

  const saveProfile = () => {
    if (
      age !== '' &&
      (isNaN(Number(age)) ||
        Number(age) <= 0)
    ) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'กรุณาตรวจสอบอายุ'
      );
      return;
    }

    if (
      weight !== '' &&
      (isNaN(Number(weight)) ||
        Number(weight) <= 0)
    ) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'กรุณาตรวจสอบน้ำหนัก'
      );
      return;
    }

    if (
      height !== '' &&
      (isNaN(Number(height)) ||
        Number(height) <= 0)
    ) {
      Alert.alert(
        'ข้อมูลไม่ถูกต้อง',
        'กรุณาตรวจสอบส่วนสูง'
      );
      return;
    }

    setEditingProfile(false);

    Alert.alert(
      'บันทึกสำเร็จ',
      'ข้อมูลส่วนตัวของคุณถูกบันทึกแล้ว'
    );
  };

  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  const changePassword = () => {
    if (isAdmin) {
      Alert.alert(
        'Admin Account',
        'บัญชี Admin ตัวอย่างใช้รหัสผ่านที่กำหนดไว้ในระบบ และไม่สามารถเปลี่ยนจากหน้านี้ได้'
      );
      return;
    }

    if (
      oldPassword === '' ||
      newPassword === '' ||
      confirmNewPassword === ''
    ) {
      Alert.alert(
        'ข้อมูลไม่ครบ',
        'กรุณากรอกข้อมูลให้ครบทุกช่อง'
      );
      return;
    }

    if (
      oldPassword !==
      registeredPassword
    ) {
      Alert.alert(
        'เปลี่ยนรหัสผ่านไม่สำเร็จ',
        'รหัสผ่านเดิมไม่ถูกต้อง'
      );
      return;
    }

    if (
      newPassword.length < 6
    ) {
      Alert.alert(
        'รหัสผ่านไม่ถูกต้อง',
        'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
      );
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      Alert.alert(
        'รหัสผ่านไม่ตรงกัน',
        'กรุณากรอกรหัสผ่านใหม่ให้ตรงกัน'
      );
      return;
    }

    setRegisteredPassword(
      newPassword
    );

    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');

    setShowChangePassword(false);

    Alert.alert(
      'เปลี่ยนรหัสผ่านสำเร็จ',
      'รหัสผ่านใหม่ถูกบันทึกแล้ว'
    );
  };

  // ===================================================
  // CAMERA
  // ===================================================

  const takePhoto = async () => {
    const permissionResult =
      await ImagePicker
        .requestCameraPermissionsAsync();

    if (
      !permissionResult.granted
    ) {
      Alert.alert(
        'สิทธิ์ถูกปฏิเสธ',
        'คุณต้องอนุญาตให้เข้าถึงกล้อง'
      );
      return;
    }

    const pickerResult =
      await ImagePicker.launchCameraAsync(
        {
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        }
      );

    if (
      !pickerResult.canceled
    ) {
      setImage(
        pickerResult.assets[0].uri
      );

      setResult(null);
    }
  };

  // ===================================================
  // GALLERY
  // ===================================================

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (
      !permissionResult.granted
    ) {
      Alert.alert(
        'สิทธิ์ถูกปฏิเสธ',
        'คุณต้องอนุญาตให้เข้าถึงคลังภาพ'
      );
      return;
    }

    const pickerResult =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes:
            ImagePicker
              .MediaTypeOptions
              .Images,

          allowsEditing: true,

          aspect: [1, 1],

          quality: 0.8,
        }
      );

    if (
      !pickerResult.canceled
    ) {
      setImage(
        pickerResult.assets[0].uri
      );

      setResult(null);
    }
  };

  // ===================================================
  // AI ANALYZE
  // ===================================================

  const uploadAndAnalyze =
    async () => {
      if (!image) {
        Alert.alert(
          'ยังไม่มีรูปภาพ',
          'กรุณาถ่ายรูปหรือเลือกรูปก่อน'
        );
        return;
      }

      try {
        setLoading(true);
        setResult(null);

        console.log(
          '================================'
        );

        console.log(
          'STARTING LOCAL ONNX AI'
        );

        console.log(
          'Image:',
          image
        );

        console.log(
          '================================'
        );

        const data =
          await predictImage(
            image
          );

        console.log(
          'AI RESULT:',
          data
        );

        setResult(data);

      } catch (error) {
        console.error(
          'LOCAL AI ERROR:',
          error
        );

        Alert.alert(
          'วิเคราะห์ไม่สำเร็จ',
          `เกิดข้อผิดพลาดในการวิเคราะห์\n\n${String(
            error
          )}`
        );

        setResult(null);

      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // GET GPS
  // ===================================================

  const getLocation =
    async () => {
      try {
        setLocationLoading(true);

        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            'ไม่สามารถใช้ตำแหน่งได้',
            'กรุณาอนุญาต Location ในการตั้งค่าโทรศัพท์'
          );
          return;
        }

        const currentLocation =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
            }
          );

        setLocation(
          currentLocation
        );

      } catch (error) {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถรับตำแหน่ง GPS ได้'
        );

      } finally {
        setLocationLoading(
          false
        );
      }
    };

  // ===================================================
  // DISTANCE
  // ===================================================

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;

    const dLat =
      ((lat2 - lat1) *
        Math.PI) /
      180;

    const dLon =
      ((lon2 - lon1) *
        Math.PI) /
      180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(
        (lat1 * Math.PI) /
          180
      ) *
        Math.cos(
          (lat2 * Math.PI) /
            180
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

  // ===================================================
  // SEARCH HOSPITAL
  // ===================================================

  const searchHospitals =
    async () => {
      if (
        searchText.trim() === ''
      ) {
        Alert.alert(
          'กรุณากรอกชื่อโรงพยาบาล',
          'เช่น ศิริราช, จุฬา, รามาธิบดี'
        );
        return;
      }

      try {
        setHospitalLoading(
          true
        );

        setHospitals([]);

        let currentLocation =
          location;

        if (!currentLocation) {
          const permission =
            await Location.requestForegroundPermissionsAsync();

          if (
            !permission.granted
          ) {
            Alert.alert(
              'ไม่สามารถใช้ตำแหน่งได้',
              'กรุณาอนุญาต Location ก่อนค้นหาโรงพยาบาล'
            );
            return;
          }

          currentLocation =
            await Location.getCurrentPositionAsync(
              {
                accuracy:
                  Location.Accuracy.High,
              }
            );

          setLocation(
            currentLocation
          );
        }

        const query =
          `โรงพยาบาล ${searchText.trim()}, Thailand`;

        const url =
          `${NOMINATIM_URL}?` +
          `q=${encodeURIComponent(
            query
          )}` +
          `&format=jsonv2` +
          `&limit=20` +
          `&addressdetails=1` +
          `&countrycodes=th`;

        const response =
          await fetch(url, {
            headers: {
              Accept:
                'application/json',
              'User-Agent':
                'SkinScanAI/1.0',
            },
          });

        if (
          !response.ok
        ) {
          throw new Error(
            'Hospital search error'
          );
        }

        const data =
          await response.json();

        const currentLat =
          currentLocation.coords.latitude;

        const currentLon =
          currentLocation.coords.longitude;

        const formatted =
          data.map(
            (item: any) => {
              const hospitalLat =
                parseFloat(
                  item.lat
                );

              const hospitalLon =
                parseFloat(
                  item.lon
                );

              const distance =
                calculateDistance(
                  currentLat,
                  currentLon,
                  hospitalLat,
                  hospitalLon
                );

              return {
                id: item.place_id,

                name:
                  item.display_name ||
                  searchText,

                address:
                  item.display_name ||
                  'ไม่พบที่อยู่',

                latitude:
                  hospitalLat,

                longitude:
                  hospitalLon,

                distance,
              };
            }
          );

        formatted.sort(
          (
            a: any,
            b: any
          ) =>
            a.distance -
            b.distance
        );

        setHospitals(
          formatted
        );

        if (
          formatted.length === 0
        ) {
          Alert.alert(
            'ไม่พบโรงพยาบาล',
            'ลองค้นหาด้วยชื่ออื่น เช่น ศิริราช หรือ จุฬาลงกรณ์'
          );
        }

      } catch (error) {
        Alert.alert(
          'ค้นหาไม่สำเร็จ',
          'ไม่สามารถค้นหาโรงพยาบาลได้ กรุณาลองใหม่'
        );

      } finally {
        setHospitalLoading(
          false
        );
      }
    };

  // ===================================================
  // GOOGLE MAPS
  // ===================================================

  const openGoogleMaps = async (
    latitude: number,
    longitude: number
  ) => {
    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${latitude},${longitude}`;

    try {
      await Linking.openURL(
        url
      );

    } catch (error) {
      Alert.alert(
        'ไม่สามารถเปิด Google Maps ได้'
      );
    }
  };

  // ===================================================
  // FORMAT DISTANCE
  // ===================================================

  const formatDistance = (
    distance: number
  ) => {
    if (distance < 1) {
      return `${Math.round(
        distance * 1000
      )} เมตร`;
    }

    return `${distance.toFixed(
      1
    )} กม.`;
  };

  // ===================================================
  // AUTO GPS
  // ===================================================

  useEffect(() => {
    if (
      isLoggedIn &&
      activeTab === 'hospital' &&
      !location
    ) {
      getLocation();
    }
  }, [
    activeTab,
    isLoggedIn,
  ]);

  // ===================================================
  // PREDICTION TEXT
  // ===================================================

  const getPredictionText = (
    prediction: string
  ) => {
    switch (prediction) {
      case 'benign':
        return 'Benign (รอยโรคไม่ร้าย)';

      case 'melanoma':
        return 'Melanoma (มะเร็งผิวหนัง)';

      case 'nevus':
        return 'Melanocytic Nevi (ไฝ)';

      default:
        return prediction;
    }
  };

  // ===================================================
  // RISK TEXT
  // ===================================================

  const getRiskText = (
    risk: string
  ) => {
    switch (risk) {
      case 'Urgent':
        return 'เร่งด่วน';

      case 'Normal':
        return 'ปกติ';

      case 'Uncertain':
        return 'ไม่แน่ชัด';

      default:
        return risk;
    }
  };

  // ===================================================
  // LOGIN SCREEN
  // ===================================================

  if (!isLoggedIn) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }
          style={
            styles.loginCard
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.loginScroll
            }
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={styles.title}
            >
              SkinScan AI
            </Text>

            {isRegistering ? (
              <>
                <Text
                  style={
                    styles.subtitle
                  }
                >
                  ลงทะเบียนผู้ใช้งานใหม่
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="ชื่อผู้ใช้งาน (Username)"
                  placeholderTextColor="#64748b"
                  value={
                    regUsername
                  }
                  onChangeText={
                    setRegUsername
                  }
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="อีเมล (Email)"
                  placeholderTextColor="#64748b"
                  value={regEmail}
                  onChangeText={
                    setRegEmail
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)"
                  placeholderTextColor="#64748b"
                  value={
                    regPassword
                  }
                  onChangeText={
                    setRegPassword
                  }
                  secureTextEntry
                />

                <TextInput
                  style={styles.input}
                  placeholder="ยืนยันรหัสผ่าน"
                  placeholderTextColor="#64748b"
                  value={
                    regConfirmPassword
                  }
                  onChangeText={
                    setRegConfirmPassword
                  }
                  secureTextEntry
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
                      styles.buttonText
                    }
                  >
                    สร้างบัญชีผู้ใช้
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.switchAuthButton
                  }
                  onPress={() =>
                    setIsRegistering(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.switchAuthText
                    }
                  >
                    มีบัญชีแล้ว?{' '}
                    <Text
                      style={
                        styles.boldBlue
                      }
                    >
                      เข้าสู่ระบบ
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.subtitle
                  }
                >
                  เข้าสู่ระบบเพื่อใช้งาน
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="ชื่อผู้ใช้งาน (Username)"
                  placeholderTextColor="#64748b"
                  value={username}
                  onChangeText={
                    setUsername
                  }
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="รหัสผ่าน (Password)"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  secureTextEntry
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
                      styles.buttonText
                    }
                  >
                    เข้าสู่ระบบ
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.switchAuthButton
                  }
                  onPress={() =>
                    setIsRegistering(
                      true
                    )
                  }
                >
                  <Text
                    style={
                      styles.switchAuthText
                    }
                  >
                    ยังไม่มีบัญชี?{' '}
                    <Text
                      style={
                        styles.boldBlue
                      }
                    >
                      สมัครสมาชิกที่นี่
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ===================================================
  // MAIN APP
  // ===================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <View>
          <Text
            style={
              styles.headerTitle
            }
          >
            SkinScan AI
          </Text>

          <Text
            style={styles.headerText}
          >
            {isAdmin
              ? '🛡️ Admin'
              : `👤 ${username}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={
            handleLogout
          }
        >
          <Text
            style={styles.logoutText}
          >
            ออกจากระบบ
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}

      <View
        style={{ flex: 1 }}
      >
        {/* =================================================
            SCAN
        ================================================= */}

        {activeTab === 'scan' && (
          <ScrollView
            contentContainerStyle={
              styles.content
            }
          >
            <Text
              style={styles.pageTitle}
            >
              ถ่ายภาพรอยโรคผิวหนัง
            </Text>

            <Text
              style={
                styles.description
              }
            >
              ถ่ายภาพหรือเลือกรูปภาพเพื่อวิเคราะห์ด้วย AI
            </Text>

            <View
              style={{
                width: '100%',
                marginBottom: 15,
                padding: 10,
                borderRadius: 10,
                backgroundColor:
                  '#dcfce7',
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#166534',
                }}
              >
                ✅ AI พร้อมสำหรับการวิเคราะห์
              </Text>
            </View>

            <View
              style={
                styles.imageBox
              }
            >
              {image ? (
                <Image
                  source={{
                    uri: image,
                  }}
                  style={
                    styles.image
                  }
                />
              ) : (
                <Text
                  style={
                    styles.placeholder
                  }
                >
                  ยังไม่มีรูปภาพ
                </Text>
              )}
            </View>

            <View
              style={
                styles.actionRow
              }
            >
              <TouchableOpacity
                style={
                  styles.halfButton
                }
                onPress={
                  takePhoto
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  📸 ถ่ายรูป
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.halfButton
                }
                onPress={
                  pickImage
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  🖼️ เลือกรูป
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!image ||
                  loading) &&
                  styles.disabledButton,
              ]}
              onPress={
                uploadAndAnalyze
              }
              disabled={
                !image ||
                loading
              }
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    color="#fff"
                  />

                  <Text
                    style={[
                      styles.buttonText,
                      {
                        marginTop: 5,
                      },
                    ]}
                  >
                    กำลังวิเคราะห์...
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  🔍 วิเคราะห์ด้วย AI
                </Text>
              )}
            </TouchableOpacity>

            {/* AI RESULT */}

            {result &&
              !loading && (
                <View
                  style={
                    styles.resultBox
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
                      styles.resultText
                    }
                  >
                    ผลการจำแนก:{' '}
                    <Text
                      style={
                        styles.boldText
                      }
                    >
                      {getPredictionText(
                        result.prediction
                      )}
                    </Text>
                  </Text>

                  <Text
                    style={
                      styles.resultText
                    }
                  >
                    ความมั่นใจ:{' '}
                    <Text
                      style={
                        styles.boldText
                      }
                    >
                      {(
                        result.confidence *
                        100
                      ).toFixed(
                        1
                      )}
                      %
                    </Text>
                  </Text>

                  <Text
                    style={[
                      styles.resultText,
                      result.risk_level ===
                        'Urgent'
                        ? styles.textRed
                        : result.risk_level ===
                          'Uncertain'
                          ? styles.textYellow
                          : styles.textGreen,
                    ]}
                  >
                    ระดับความเสี่ยง:{' '}
                    {getRiskText(
                      result.risk_level
                    )}
                  </Text>

                  {/* PROBABILITIES */}

                  {result.probabilities && (
                    <View
                      style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTopWidth: 1,
                        borderTopColor:
                          '#e2e8f0',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight:
                            'bold',
                          color:
                            '#334155',
                          marginBottom: 5,
                        }}
                      >
                        คะแนนแต่ละประเภท
                      </Text>

                      <Text
                        style={
                          styles.probabilityText
                        }
                      >
                        Benign:{' '}
                        {(
                          (
                            result
                              .probabilities
                              .benign ??
                            0
                          ) * 100
                        ).toFixed(
                          1
                        )}
                        %
                      </Text>

                      <Text
                        style={
                          styles.probabilityText
                        }
                      >
                        Melanoma:{' '}
                        {(
                          (
                            result
                              .probabilities
                              .melanoma ??
                            0
                          ) * 100
                        ).toFixed(
                          1
                        )}
                        %
                      </Text>

                      <Text
                        style={
                          styles.probabilityText
                        }
                      >
                        Nevus:{' '}
                        {(
                          (
                            result
                              .probabilities
                              .nevus ??
                            0
                          ) * 100
                        ).toFixed(
                          1
                        )}
                        %
                      </Text>
                    </View>
                  )}

                  <Text
                    style={
                      styles.medicalNotice
                    }
                  >
                    หมายเหตุ: ผลจาก AI
                    เป็นข้อมูลเบื้องต้น
                    ไม่ใช่การวินิจฉัยทางการแพทย์
                  </Text>
                </View>
              )}
          </ScrollView>
        )}

        {/* =================================================
            HISTORY
        ================================================= */}

        {activeTab ===
          'history' && (
          <View
            style={
              styles.fullTabContainer
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              ประวัติการสแกนย้อนหลัง
            </Text>

            <FlatList
              data={
                MOCK_USER_HISTORY
              }
              keyExtractor={(
                item
              ) => item.id}
              showsVerticalScrollIndicator={
                false
              }
              renderItem={({
                item,
              }) => (
                <View
                  style={
                    styles.listCard
                  }
                >
                  <View
                    style={
                      styles.cardHeader
                    }
                  >
                    <Text
                      style={
                        styles.boldText
                      }
                    >
                      📅 {item.date}
                    </Text>

                    <View
                      style={[
                        styles.badge,
                        item.risk ===
                          'Urgent'
                          ? styles.bgRed
                          : styles.bgGreen,
                      ]}
                    >
                      <Text
                        style={
                          styles.badgeText
                        }
                      >
                        {item.risk}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.cardText
                    }
                  >
                    ผลการวิเคราะห์:{' '}
                    <Text
                      style={
                        styles.boldText
                      }
                    >
                      {item.prediction}
                    </Text>
                  </Text>

                  <Text
                    style={
                      styles.cardText
                    }
                  >
                    ความแม่นยำ:{' '}
                    {(
                      item.confidence *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* =================================================
            KNOWLEDGE
        ================================================= */}

        {activeTab ===
          'knowledge' && (
          <View
            style={
              styles.fullTabContainer
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              คลังความรู้และอาการเบื้องต้น
            </Text>

            <FlatList
              data={
                MOCK_ARTICLES
              }
              keyExtractor={(
                item
              ) => item.id}
              showsVerticalScrollIndicator={
                false
              }
              renderItem={({
                item,
              }) => (
                <View
                  style={
                    styles.listCard
                  }
                >
                  <Text
                    style={
                      styles.articleTitle
                    }
                  >
                    📌 {item.title}
                  </Text>

                  <Text
                    style={
                      styles.articleDesc
                    }
                  >
                    {item.desc}
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.readMoreBtn
                    }
                    onPress={() =>
                      setSelectedArticle(
                        item
                      )
                    }
                  >
                    <Text
                      style={
                        styles.readMoreText
                      }
                    >
                      อ่านรายละเอียดเพิ่มเติม →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {/* =================================================
            HOSPITAL
        ================================================= */}

        {activeTab ===
          'hospital' && (
          <ScrollView
            contentContainerStyle={
              styles.content
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              🏥 ค้นหาโรงพยาบาล
            </Text>

            <Text
              style={
                styles.description
              }
            >
              ค้นหาโรงพยาบาลและดูระยะทางจากตำแหน่งปัจจุบัน
            </Text>

            <View
              style={
                styles.searchRow
              }
            >
              <TextInput
                style={
                  styles.searchInput
                }
                placeholder="เช่น ศิริราช, จุฬา, รามาธิบดี"
                placeholderTextColor="#303843"
                value={
                  searchText
                }
                onChangeText={
                  setSearchText
                }
                onSubmitEditing={
                  searchHospitals
                }
              />

              <TouchableOpacity
                style={
                  styles.searchButton
                }
                onPress={
                  searchHospitals
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  ค้นหา
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.locationBox
              }
            >
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.locationTitle
                  }
                >
                  📍 ตำแหน่งปัจจุบัน
                </Text>

                <Text
                  style={
                    styles.locationText
                  }
                >
                  {location
                    ? 'GPS พร้อมใช้งาน'
                    : 'ยังไม่ได้รับตำแหน่ง'}
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.locationButton
                }
                onPress={
                  getLocation
                }
                disabled={
                  locationLoading
                }
              >
                {locationLoading ? (
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                  />
                ) : (
                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    อัปเดต GPS
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {hospitalLoading && (
              <View
                style={
                  styles.loadingBox
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#0284c7"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  กำลังค้นหาโรงพยาบาล...
                </Text>
              </View>
            )}

            {!hospitalLoading &&
              hospitals.map(
                (hospital) => (
                  <View
                    key={
                      hospital.id
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
                      🏥 {hospital.name}
                    </Text>

                    <Text
                      style={
                        styles.hospitalAddress
                      }
                    >
                      {hospital.address}
                    </Text>

                    <Text
                      style={
                        styles.distanceText
                      }
                    >
                      📍 ระยะทางประมาณ{' '}
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
                          hospital.latitude,
                          hospital.longitude
                        )
                      }
                    >
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        🗺️ เปิด Google Maps
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              )}

            {!hospitalLoading &&
              searchText.trim() !==
                '' &&
              hospitals.length ===
                0 && (
                <View
                  style={
                    styles.noResultBox
                  }
                >
                  <Text
                    style={
                      styles.noResultText
                    }
                  >
                    ยังไม่มีผลการค้นหา
                  </Text>

                  <Text
                    style={
                      styles.noResultSubText
                    }
                  >
                    ลองค้นหาด้วยชื่อโรงพยาบาล เช่น
                    "ศิริราช"
                  </Text>
                </View>
              )}
          </ScrollView>
        )}

        {/* =================================================
            PROFILE
        ================================================= */}

        {activeTab ===
          'profile' && (
          <ScrollView
            contentContainerStyle={
              styles.content
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              โปรไฟล์
            </Text>

            {/* PROFILE HEADER */}

            <View
              style={
                styles.profileBox
              }
            >
              <TouchableOpacity
                onPress={
                  changeProfileImage
                }
                activeOpacity={
                  0.8
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
                      styles.profileAvatarCircle
                    }
                  >
                    <Text
                      style={
                        styles.profileAvatarIcon
                      }
                    >
                      👤
                    </Text>
                  </View>
                )}

                <View
                  style={
                    styles.changePhotoBadge
                  }
                >
                  <Text
                    style={
                      styles.changePhotoText
                    }
                  >
                    📷
                  </Text>
                </View>
              </TouchableOpacity>

              <Text
                style={
                  styles.profileName
                }
              >
                {isAdmin
                  ? 'Administrator'
                  : firstName ||
                    lastName
                    ? `${firstName} ${lastName}`.trim()
                    : username}
              </Text>

              <Text
                style={
                  styles.profileUsername
                }
              >
                {isAdmin
                  ? '🛡️ Admin Account'
                  : `@${username}`}
              </Text>

              <TouchableOpacity
                onPress={
                  changeProfileImage
                }
              >
                <Text
                  style={
                    styles.changePhotoLink
                  }
                >
                  เปลี่ยนรูปโปรไฟล์
                </Text>
              </TouchableOpacity>
            </View>

            {/* PERSONAL INFORMATION */}

            <View
              style={
                styles.profileInfoBox
              }
            >
              <View
                style={
                  styles.profileSectionHeader
                }
              >
                <Text
                  style={
                    styles.profileInfoTitle
                  }
                >
                  ข้อมูลส่วนตัว
                </Text>

                {!editingProfile && (
                  <TouchableOpacity
                    onPress={() =>
                      setEditingProfile(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.editText
                      }
                    >
                      ✏️ แก้ไข
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {editingProfile ? (
                <>
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    ชื่อ
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="ชื่อ"
                    placeholderTextColor="#94a3b8"
                    value={
                      firstName
                    }
                    onChangeText={
                      setFirstName
                    }
                  />

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    นามสกุล
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="นามสกุล"
                    placeholderTextColor="#94a3b8"
                    value={
                      lastName
                    }
                    onChangeText={
                      setLastName
                    }
                  />

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    อายุ
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="อายุ"
                    placeholderTextColor="#94a3b8"
                    value={age}
                    onChangeText={
                      setAge
                    }
                    keyboardType="numeric"
                  />

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    น้ำหนัก (กิโลกรัม)
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="เช่น 65"
                    placeholderTextColor="#94a3b8"
                    value={
                      weight
                    }
                    onChangeText={
                      setWeight
                    }
                    keyboardType="decimal-pad"
                  />

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    ส่วนสูง (เซนติเมตร)
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="เช่น 175"
                    placeholderTextColor="#94a3b8"
                    value={
                      height
                    }
                    onChangeText={
                      setHeight
                    }
                    keyboardType="decimal-pad"
                  />

                  <View
                    style={
                      styles.profileButtonRow
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.cancelButton
                      }
                      onPress={() =>
                        setEditingProfile(
                          false
                        )
                      }
                    >
                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        ยกเลิก
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.saveButton
                      }
                      onPress={
                        saveProfile
                      }
                    >
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        บันทึก
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={
                      styles.infoRow
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      ชื่อ-นามสกุล
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {firstName ||
                      lastName
                        ? `${firstName} ${lastName}`.trim()
                        : 'ยังไม่ได้ระบุ'}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.infoRow
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      อายุ
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {age
                        ? `${age} ปี`
                        : 'ยังไม่ได้ระบุ'}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.infoRow
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      น้ำหนัก
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {weight
                        ? `${weight} กก.`
                        : 'ยังไม่ได้ระบุ'}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.infoRow
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      ส่วนสูง
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {height
                        ? `${height} ซม.`
                        : 'ยังไม่ได้ระบุ'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* ACCOUNT */}

            <View
              style={
                styles.profileInfoBox
              }
            >
              <Text
                style={
                  styles.profileInfoTitle
                }
              >
                ข้อมูลบัญชี
              </Text>

              <View
                style={
                  styles.infoRow
                }
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  Username
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {isAdmin
                    ? ADMIN_USERNAME
                    : username}
                </Text>
              </View>

              <View
                style={
                  styles.infoRow
                }
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  สถานะ
                </Text>

                <Text
                  style={
                    styles.infoValueGreen
                  }
                >
                  {isAdmin
                    ? 'Administrator'
                    : 'ผู้ใช้งาน'}
                </Text>
              </View>
            </View>

            {/* CHANGE PASSWORD */}

            <View
              style={
                styles.profileInfoBox
              }
            >
              <View
                style={
                  styles.profileSectionHeader
                }
              >
                <Text
                  style={
                    styles.profileInfoTitle
                  }
                >
                  ความปลอดภัย
                </Text>
              </View>

              {isAdmin ? (
                <View
                  style={
                    styles.adminAccountBox
                  }
                >
                  <Text
                    style={
                      styles.adminAccountTitle
                    }
                  >
                    🛡️ Admin Account
                  </Text>

                  <Text
                    style={
                      styles.adminAccountText
                    }
                  >
                    บัญชี Admin สำหรับ Demo
                    ไม่สามารถเปลี่ยนรหัสผ่านจากหน้านี้ได้
                  </Text>
                </View>
              ) : !showChangePassword ? (
                <TouchableOpacity
                  style={
                    styles.securityButton
                  }
                  onPress={() =>
                    setShowChangePassword(
                      true
                    )
                  }
                >
                  <Text
                    style={
                      styles.securityButtonText
                    }
                  >
                    🔐 เปลี่ยนรหัสผ่าน
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    รหัสผ่านเดิม
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="กรอกรหัสผ่านเดิม"
                    placeholderTextColor="#94a3b8"
                    value={
                      oldPassword
                    }
                    onChangeText={
                      setOldPassword
                    }
                    secureTextEntry
                  />

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    รหัสผ่านใหม่
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    placeholderTextColor="#94a3b8"
                    value={
                      newPassword
                    }
                    onChangeText={
                      setNewPassword
                    }
                    secureTextEntry
                  />

                  <Text
                    style={
                      styles.fieldLabel
                    }
                  >
                    ยืนยันรหัสผ่านใหม่
                  </Text>

                  <TextInput
                    style={
                      styles.profileInput
                    }
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    placeholderTextColor="#94a3b8"
                    value={
                      confirmNewPassword
                    }
                    onChangeText={
                      setConfirmNewPassword
                    }
                    secureTextEntry
                  />

                  <View
                    style={
                      styles.profileButtonRow
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.cancelButton
                      }
                      onPress={() => {
                        setOldPassword(
                          ''
                        );

                        setNewPassword(
                          ''
                        );

                        setConfirmNewPassword(
                          ''
                        );

                        setShowChangePassword(
                          false
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        ยกเลิก
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.saveButton
                      }
                      onPress={
                        changePassword
                      }
                    >
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        เปลี่ยนรหัส
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* LOGOUT */}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.logoutButton,
              ]}
              onPress={
                handleLogout
              }
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                🚪 ออกจากระบบ
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* =================================================
          BOTTOM TAB
      ================================================= */}

      <View
        style={styles.tabBar}
      >
        <TouchableOpacity
          style={
            styles.tabItem
          }
          onPress={() =>
            setActiveTab('scan')
          }
        >
          <Text
            style={styles.tabIcon}
          >
            🔍
          </Text>

          <Text
            style={[
              styles.tabLabel,
              activeTab ===
                'scan' &&
                styles.activeTabLabel,
            ]}
          >
            สแกน
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.tabItem
          }
          onPress={() =>
            setActiveTab(
              'history'
            )
          }
        >
          <Text
            style={styles.tabIcon}
          >
            📜
          </Text>

          <Text
            style={[
              styles.tabLabel,
              activeTab ===
                'history' &&
                styles.activeTabLabel,
            ]}
          >
            ประวัติ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.tabItem
          }
          onPress={() =>
            setActiveTab(
              'knowledge'
            )
          }
        >
          <Text
            style={styles.tabIcon}
          >
            📖
          </Text>

          <Text
            style={[
              styles.tabLabel,
              activeTab ===
                'knowledge' &&
                styles.activeTabLabel,
            ]}
          >
            ความรู้
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.tabItem
          }
          onPress={() =>
            setActiveTab(
              'hospital'
            )
          }
        >
          <Text
            style={styles.tabIcon}
          >
            🏥
          </Text>

          <Text
            style={[
              styles.tabLabel,
              activeTab ===
                'hospital' &&
                styles.activeTabLabel,
            ]}
          >
            โรงพยาบาล
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.tabItem
          }
          onPress={() =>
            setActiveTab(
              'profile'
            )
          }
        >
          <Text
            style={styles.tabIcon}
          >
            👤
          </Text>

          <Text
            style={[
              styles.tabLabel,
              activeTab ===
                'profile' &&
                styles.activeTabLabel,
            ]}
          >
            โปรไฟล์
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          KNOWLEDGE MODAL
      ================================================= */}

      <Modal
        visible={
          selectedArticle !==
          null
        }
        animationType="slide"
        transparent={true}
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
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              {
                selectedArticle?.title
              }
            </Text>

            <ScrollView
              style={
                styles.modalScroll
              }
            >
              <Text
                style={
                  styles.modalText
                }
              >
                {
                  selectedArticle?.content ||
                  selectedArticle?.desc
                }
              </Text>
            </ScrollView>

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
                  styles.buttonText
                }
              >
                ปิดหน้าต่าง
              </Text>
            </TouchableOpacity>
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
    backgroundColor:
      '#f8fafc',
  },

  // ===================================================
  // LOGIN
  // ===================================================

  loginCard: {
    flex: 1,
    justifyContent:
      'center',
    padding: 20,
  },

  loginScroll: {
    flexGrow: 1,
    justifyContent:
      'center',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0284c7',
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },

  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 16,
    fontSize: 16,
  },

  primaryButton: {
    backgroundColor:
      '#0284c7',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },

  disabledButton: {
    backgroundColor:
      '#94a3b8',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  switchAuthButton: {
    alignItems:
      'center',
    marginTop: 18,
  },

  switchAuthText: {
    color: '#64748b',
    fontSize: 14,
  },

  boldBlue: {
    color: '#0284c7',
    fontWeight: 'bold',
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    alignItems:
      'center',
    padding: 16,
    backgroundColor:
      '#fff',
    borderBottomWidth: 1,
    borderBottomColor:
      '#e2e8f0',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
  },

  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },

  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // ===================================================
  // GENERAL
  // ===================================================

  content: {
    padding: 20,
    alignItems:
      'center',
    paddingBottom: 30,
  },

  fullTabContainer: {
    flex: 1,
    padding: 16,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },

  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },

  // ===================================================
  // IMAGE
  // ===================================================

  imageBox: {
    width: 260,
    height: 260,
    backgroundColor:
      '#e2e8f0',
    borderRadius: 16,
    justifyContent:
      'center',
    alignItems:
      'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor:
      '#cbd5e1',
    borderStyle:
      'dashed',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  placeholder: {
    color: '#64748b',
    fontSize: 16,
  },

  actionRow: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    width: '100%',
    marginBottom: 16,
  },

  halfButton: {
    backgroundColor:
      '#3b82f6',
    padding: 12,
    borderRadius: 10,
    width: '48%',
    alignItems:
      'center',
  },

  // ===================================================
  // AI RESULT
  // ===================================================

  resultBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor:
      '#fff',
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
    elevation: 2,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    textAlign:
      'center',
  },

  resultText: {
    fontSize: 15,
    marginBottom: 8,
    color: '#334155',
  },

  boldText: {
    fontWeight: 'bold',
    color: '#0f172a',
  },

  textRed: {
    color: '#ef4444',
    fontWeight: 'bold',
  },

  textGreen: {
    color: '#10b981',
    fontWeight: 'bold',
  },

  textYellow: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },

  probabilityText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 3,
  },

  medicalNotice: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },

  // ===================================================
  // HISTORY / KNOWLEDGE
  // ===================================================

  listCard: {
    backgroundColor:
      '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
  },

  cardHeader: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    marginBottom: 8,
  },

  cardText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },

  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },

  articleDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 18,
  },

  readMoreBtn: {
    alignSelf:
      'flex-start',
    paddingVertical: 4,
  },

  readMoreText: {
    color: '#0284c7',
    fontWeight: 'bold',
    fontSize: 13,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  bgRed: {
    backgroundColor:
      '#fee2e2',
  },

  bgGreen: {
    backgroundColor:
      '#dcfce7',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // ===================================================
  // HOSPITAL
  // ===================================================

  searchRow: {
    flexDirection:
      'row',
    width: '100%',
    marginBottom: 15,
  },

  searchInput: {
    flex: 1,
    backgroundColor:
      '#fff',
    borderWidth: 1,
    borderColor:
      '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginRight: 8,
  },

  searchButton: {
    backgroundColor:
      '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent:
      'center',
    alignItems:
      'center',
  },

  locationBox: {
    width: '100%',
    backgroundColor:
      '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
    flexDirection:
      'row',
    alignItems:
      'center',
  },

  locationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },

  locationText: {
    fontSize: 13,
    color: '#64748b',
  },

  locationButton: {
    backgroundColor:
      '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },

  loadingBox: {
    alignItems:
      'center',
    marginTop: 20,
    marginBottom: 20,
  },

  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },

  hospitalCard: {
    width: '100%',
    backgroundColor:
      '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
    elevation: 2,
  },

  hospitalName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },

  hospitalAddress: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 10,
  },

  distanceText: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: 'bold',
    marginBottom: 12,
  },

  mapButton: {
    backgroundColor:
      '#16a34a',
    padding: 12,
    borderRadius: 9,
    alignItems:
      'center',
  },

  noResultBox: {
    width: '100%',
    padding: 20,
    backgroundColor:
      '#fff',
    borderRadius: 12,
    alignItems:
      'center',
    marginTop: 10,
  },

  noResultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 5,
  },

  noResultSubText: {
    fontSize: 13,
    color: '#64748b',
    textAlign:
      'center',
  },

  // ===================================================
  // PROFILE
  // ===================================================

  profileBox: {
    width: '100%',
    alignItems:
      'center',
    marginBottom: 24,
  },

  profileAvatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor:
      '#e0f2fe',
    justifyContent:
      'center',
    alignItems:
      'center',
    borderWidth: 3,
    borderColor:
      '#bae6fd',
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor:
      '#bae6fd',
  },

  profileAvatarIcon: {
    fontSize: 52,
  },

  changePhotoBadge: {
    position:
      'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      '#0284c7',
    justifyContent:
      'center',
    alignItems:
      'center',
    borderWidth: 3,
    borderColor:
      '#f8fafc',
  },

  changePhotoText: {
    fontSize: 15,
  },

  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 10,
  },

  profileUsername: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },

  changePhotoLink: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
  },

  profileInfoBox: {
    width: '100%',
    backgroundColor:
      '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
    marginBottom: 16,
  },

  profileSectionHeader: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    alignItems:
      'center',
    marginBottom: 12,
  },

  profileInfoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  editText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: 'bold',
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },

  profileInput: {
    width: '100%',
    backgroundColor:
      '#f8fafc',
    borderWidth: 1,
    borderColor:
      '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 4,
  },

  profileButtonRow: {
    flexDirection:
      'row',
    gap: 10,
    marginTop: 14,
  },

  cancelButton: {
    flex: 1,
    backgroundColor:
      '#e2e8f0',
    padding: 12,
    borderRadius: 9,
    alignItems:
      'center',
  },

  cancelButtonText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 14,
  },

  saveButton: {
    flex: 1,
    backgroundColor:
      '#0284c7',
    padding: 12,
    borderRadius: 9,
    alignItems:
      'center',
  },

  infoRow: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    alignItems:
      'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      '#f1f5f9',
  },

  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },

  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign:
      'right',
  },

  infoValueGreen: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: 'bold',
  },

  securityButton: {
    backgroundColor:
      '#f1f5f9',
    padding: 13,
    borderRadius: 9,
    alignItems:
      'center',
  },

  securityButtonText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 14,
  },

  adminAccountBox: {
    backgroundColor:
      '#f0f9ff',
    borderWidth: 1,
    borderColor:
      '#bae6fd',
    borderRadius: 9,
    padding: 13,
  },

  adminAccountTitle: {
    color: '#0369a1',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },

  adminAccountText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },

  logoutButton: {
    backgroundColor:
      '#ef4444',
    marginTop: 10,
  },

  // ===================================================
  // TAB BAR
  // ===================================================

  tabBar: {
    flexDirection:
      'row',
    backgroundColor:
      '#fff',
    borderTopWidth: 1,
    borderTopColor:
      '#e2e8f0',
    paddingVertical: 8,
    paddingBottom:
      Platform.OS === 'ios'
        ? 20
        : 8,
  },

  tabItem: {
    flex: 1,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },

  tabLabel: {
    fontSize: 10,
    color: '#64748b',
  },

  activeTabLabel: {
    color: '#0284c7',
    fontWeight:
      'bold',
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.5)',
    justifyContent:
      'center',
    alignItems:
      'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor:
      '#fff',
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity:
      0.25,
    shadowRadius: 4,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    textAlign:
      'center',
  },

  modalScroll: {
    marginVertical: 10,
  },

  modalText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },

  closeButton: {
    backgroundColor:
      '#0f172a',
    padding: 12,
    borderRadius: 10,
    alignItems:
      'center',
    marginTop: 16,
  },
});