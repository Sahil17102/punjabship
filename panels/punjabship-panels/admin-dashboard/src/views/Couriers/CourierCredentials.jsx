import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Spinner,
  Select,
  Switch,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { fetchSMECourierStatus, saveSMECourierCredentials, fetchSkylinkStatus, saveSkylinkCredentials, fetchFlightGoStatus, saveFlightGoCredentials, fetchDillikingStatus, saveDillikingCredentials, fetchM5CStatus, saveM5CCredentials } from 'services/order.service'
import {
  useBookDelhiveryLtlLastMileAppointment,
  useCancelDelhiveryLtlPickupRequest,
  useCancelDelhiveryLtlShipment,
  useCheckDelhiveryLtlServiceability,
  useCreateDelhiveryLtlClientWarehouse,
  useCreateDelhiveryLtlManifest,
  useCourierCredentials,
  useEstimateDelhiveryLtlFreight,
  useGenerateDelhiveryLtlDocuments,
  useGetDelhiveryLtlFreightCharges,
  useGetDelhiveryLtlGeneratedDocumentStatus,
  useGetDelhiveryLtlLrCopy,
  useGetDelhiveryLtlManifestStatus,
  useGetDelhiveryLtlShippingLabelUrls,
  useGetDelhiveryLtlShipmentUpdateStatus,
  useGetDelhiveryLtlExpectedTat,
  useLoginDelhiveryLtl,
  useLogoutDelhiveryLtl,
  useRequestDelhiveryLtlPasswordReset,
  useTestDelhiveryCredentials,
  useTrackDelhiveryLtlShipment,
  useUpdateDelhiveryLtlClientWarehouse,
  useUpdateDelhiveryLtlShipment,
  useUpdateAmazonCredentials,
  useUpdateDelhiveryCredentials,
  useUpdateEkartCredentials,
  useUpdateShadowfaxCredentials,
  useUpdateVelocityCredentials,
  useTestVelocityCredentials,
  useUpdateXpressbeesAwbRange,
  useUpdateXpressbeesCredentials,
} from 'hooks/useCouriers'

const CourierCredentials = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [smeStatus, setSmeStatus] = useState(null)
  const [smeCredentials, setSmeCredentials] = useState({ username: '', password: '', serviceCode: 'INTERNATIONAL PRIORITY' })
  const [smeSaving, setSmeSaving] = useState(false)
  const [skylinkStatus, setSkylinkStatus] = useState(null)
  const [skylinkSaving, setSkylinkSaving] = useState(false)
  const [skylinkCredentials, setSkylinkCredentials] = useState({ email: '', password: '', rateUsername: '', ratePassword: '', customerCode: '', companyId: '3', rateOriginCode: '', productCode: 'NONDOX', invoiceTypeId: '1', termsOfTrade: 'DDU', invoiceNoteCode: 'COMMERCIAL' })
  const [flightGoStatus, setFlightGoStatus] = useState(null)
  const [flightGoSaving, setFlightGoSaving] = useState(false)
  const [flightGoCredentials, setFlightGoCredentials] = useState({ username: '', password: '', apiKey: '', packageCode: 'NDX', environment: 'test' })
  const [dillikingStatus, setDillikingStatus] = useState(null)
  const [dillikingSaving, setDillikingSaving] = useState(false)
  const [dillikingCredentials, setDillikingCredentials] = useState({ email: '', password: '', environment: 'production', pcsType: 'SPX' })
  const [m5cStatus, setM5CStatus] = useState(null)
  const [m5cSaving, setM5CSaving] = useState(false)
  const [m5cCredentials, setM5CCredentials] = useState({ accountCode: '', username: '', password: '', accessKey: '', kycType: 'GST Number', kycNumber: '', goodsDescription: 'NDox', currencyCode: 'INR' })
  const bookDelhiveryLtlLastMileAppointment = useBookDelhiveryLtlLastMileAppointment()
  const cancelDelhiveryLtlPickupRequest = useCancelDelhiveryLtlPickupRequest()
  const cancelDelhiveryLtlShipment = useCancelDelhiveryLtlShipment()
  const checkDelhiveryLtlServiceability = useCheckDelhiveryLtlServiceability()
  const createDelhiveryLtlClientWarehouse = useCreateDelhiveryLtlClientWarehouse()
  const createDelhiveryLtlManifest = useCreateDelhiveryLtlManifest()
  const estimateDelhiveryLtlFreight = useEstimateDelhiveryLtlFreight()
  const generateDelhiveryLtlDocuments = useGenerateDelhiveryLtlDocuments()
  const getDelhiveryLtlFreightCharges = useGetDelhiveryLtlFreightCharges()
  const getDelhiveryLtlGeneratedDocumentStatus = useGetDelhiveryLtlGeneratedDocumentStatus()
  const getDelhiveryLtlLrCopy = useGetDelhiveryLtlLrCopy()
  const getDelhiveryLtlManifestStatus = useGetDelhiveryLtlManifestStatus()
  const getDelhiveryLtlShippingLabelUrls = useGetDelhiveryLtlShippingLabelUrls()
  const getDelhiveryLtlShipmentUpdateStatus = useGetDelhiveryLtlShipmentUpdateStatus()
  const getDelhiveryLtlExpectedTat = useGetDelhiveryLtlExpectedTat()
  const trackDelhiveryLtlShipment = useTrackDelhiveryLtlShipment()
  const { data, isLoading, error } = useCourierCredentials()
  useEffect(() => {
    fetchSMECourierStatus().then(setSmeStatus).catch(() => setSmeStatus({ configured: false }))
    fetchSkylinkStatus().then((status) => {
      setSkylinkStatus(status)
      setSkylinkCredentials((current) => ({ ...current, ...(status.settings || {}) }))
    }).catch(() => setSkylinkStatus({ configured: false }))
    fetchFlightGoStatus().then((status) => {
      setFlightGoStatus(status)
      setFlightGoCredentials((current) => ({ ...current, ...(status.settings || {}) }))
    }).catch(() => setFlightGoStatus({ configured: false }))
    fetchDillikingStatus().then((status) => {
      setDillikingStatus(status)
      setDillikingCredentials((current) => ({ ...current, ...(status.settings || {}), environment: status.environment || status.settings?.environment || 'production' }))
    }).catch(() => setDillikingStatus({ configured: false, environment: 'production' }))
    fetchM5CStatus().then((status) => {
      setM5CStatus(status)
      setM5CCredentials((current) => ({ ...current, ...(status.settings || {}) }))
    }).catch(() => setM5CStatus({ configured: false }))
  }, [])

  const handleSaveSMECredentials = async () => {
    if (!smeCredentials.username.trim() || (!smeCredentials.password && !smeStatus?.configured)) {
      toast({ title: 'Enter SME Courier username and password', status: 'warning' })
      return
    }
    setSmeSaving(true)
    try {
      const response = await saveSMECourierCredentials(smeCredentials)
      setSmeStatus(response?.data || { ...smeStatus, configured: true, passwordConfigured: true, service: smeCredentials.serviceCode })
      setSmeCredentials((current) => ({ ...current, password: '' }))
      toast({ title: 'SME Courier credentials verified and saved', status: 'success' })
    } catch (saveError) {
      toast({ title: saveError?.response?.data?.message || 'Could not save SME Courier credentials', status: 'error' })
    } finally {
      setSmeSaving(false)
    }
  }
  const handleSaveSkylinkCredentials = async () => {
    if ((!skylinkCredentials.email.trim() || !skylinkCredentials.password) && !skylinkStatus?.configured) {
      toast({ title: 'Enter Skylink login email and password', status: 'warning' })
      return
    }
    if (!skylinkCredentials.customerCode.trim() && !skylinkStatus?.configured) {
      toast({ title: 'Enter the Skylink customer code', status: 'warning' })
      return
    }
    setSkylinkSaving(true)
    try {
      const response = await saveSkylinkCredentials(skylinkCredentials)
      const status = await fetchSkylinkStatus()
      setSkylinkStatus(status)
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] })
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
      setSkylinkCredentials((current) => ({ ...current, password: '', ratePassword: '', ...(status.settings || {}) }))
      toast({ title: response?.message || 'Skylink credentials verified and saved', status: 'success' })
    } catch (saveError) {
      toast({ title: saveError?.response?.data?.message || 'Could not save Skylink credentials', status: 'error' })
    } finally {
      setSkylinkSaving(false)
    }
  }
  const handleSaveFlightGoCredentials = async () => {
    if ((!flightGoCredentials.username.trim() || !flightGoCredentials.password || !flightGoCredentials.apiKey.trim()) && !flightGoStatus?.configured) {
      toast({ title: 'Enter FlightGo username, password and API access key', status: 'warning' }); return
    }
    setFlightGoSaving(true)
    try {
      const response = await saveFlightGoCredentials(flightGoCredentials)
      const status = await fetchFlightGoStatus()
      setFlightGoStatus(status)
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] })
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
      setFlightGoCredentials((current) => ({ ...current, password: '', apiKey: '', ...(status.settings || {}) }))
      toast({ title: response?.message || 'FlightGo credentials verified and saved', status: 'success' })
    } catch (saveError) {
      toast({ title: saveError?.response?.data?.message || 'Could not save FlightGo credentials', status: 'error' })
    } finally { setFlightGoSaving(false) }
  }
  const handleSaveDillikingCredentials = async () => {
    if ((!dillikingCredentials.email.trim() || !dillikingCredentials.password) && !dillikingStatus?.configured) {
      toast({ title: 'Enter Dilliking production email and password', status: 'warning' }); return
    }
    setDillikingSaving(true)
    try {
      const response = await saveDillikingCredentials(dillikingCredentials)
      const status = await fetchDillikingStatus()
      setDillikingStatus(status)
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] })
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
      setDillikingCredentials((current) => ({ ...current, password: '', ...(status.settings || {}), environment: status.environment || 'production' }))
      toast({ title: response?.message || 'Dilliking production credentials verified and saved', status: 'success' })
    } catch (saveError) {
      toast({ title: saveError?.response?.data?.message || 'Could not save Dilliking credentials', status: 'error' })
    } finally { setDillikingSaving(false) }
  }
  const handleSaveM5CCredentials = async () => {
    if ((!m5cCredentials.accountCode.trim() || !m5cCredentials.username.trim() || !m5cCredentials.password || !m5cCredentials.accessKey.trim()) && !m5cStatus?.configured) {
      toast({ title: 'Enter the M5C account code, username, password and access key', status: 'warning' }); return
    }
    setM5CSaving(true)
    try {
      const response = await saveM5CCredentials(m5cCredentials)
      const status = await fetchM5CStatus()
      setM5CStatus(status)
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] })
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
      setM5CCredentials((current) => ({ ...current, password: '', accessKey: '', ...(status.settings || {}) }))
      toast({ title: response?.message || 'M5C production credentials verified and saved', status: 'success' })
    } catch (saveError) {
      toast({ title: saveError?.response?.data?.message || 'Could not save M5C credentials', status: 'error' })
    } finally { setM5CSaving(false) }
  }
  const loginDelhiveryLtl = useLoginDelhiveryLtl()
  const logoutDelhiveryLtl = useLogoutDelhiveryLtl()
  const testDelhivery = useTestDelhiveryCredentials()
  const updateDelhivery = useUpdateDelhiveryCredentials()
  const updateDelhiveryLtlClientWarehouse = useUpdateDelhiveryLtlClientWarehouse()
  const updateDelhiveryLtlShipment = useUpdateDelhiveryLtlShipment()
  const requestDelhiveryLtlPasswordReset = useRequestDelhiveryLtlPasswordReset()
  const updateEkart = useUpdateEkartCredentials()
  const updateShadowfax = useUpdateShadowfaxCredentials()
  const updateVelocity = useUpdateVelocityCredentials()
  const testVelocity = useTestVelocityCredentials()
  const updateXpressbees = useUpdateXpressbeesCredentials()
  const updateXpressbeesAwbRange = useUpdateXpressbeesAwbRange()
  const updateAmazon = useUpdateAmazonCredentials()

  const [form, setForm] = useState({
    apiBase: '',
    clientName: '',
    apiKey: '',
    ltlApiBase: '',
    ltlUsername: '',
    ltlPassword: '',
  })
  const [delhiveryB2CTest, setDelhiveryB2CTest] = useState({
    pincode: '110001',
    result: null,
  })
  const [delhiveryLtlServiceabilityForm, setDelhiveryLtlServiceabilityForm] = useState({
    pincode: '',
    weight: '',
    result: null,
  })
  const [delhiveryLtlTatForm, setDelhiveryLtlTatForm] = useState({
    originPin: '',
    destinationPin: '',
    result: null,
  })
  const [delhiveryLtlFreightForm, setDelhiveryLtlFreightForm] = useState({
    sourcePin: '',
    consigneePin: '',
    weightG: '',
    invoiceAmount: '',
    paymentMode: 'prepaid',
    codAmount: '',
    freightMode: 'fod',
    chequePayment: false,
    rovInsurance: true,
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    boxCount: '1',
    result: null,
  })
  const [delhiveryLtlFreightChargesForm, setDelhiveryLtlFreightChargesForm] = useState({
    lrns: '',
    result: null,
  })
  const [delhiveryLtlWarehouseForm, setDelhiveryLtlWarehouseForm] = useState({
    payload: '',
    result: null,
  })
  const [delhiveryLtlWarehouseUpdateForm, setDelhiveryLtlWarehouseUpdateForm] = useState({
    payload: '',
    result: null,
  })
  const [delhiveryLtlManifestForm, setDelhiveryLtlManifestForm] = useState({
    payload: '',
    files: [],
    result: null,
  })
  const [delhiveryLtlManifestStatusForm, setDelhiveryLtlManifestStatusForm] = useState({
    jobId: '',
    result: null,
  })
  const [delhiveryLtlShipmentUpdateForm, setDelhiveryLtlShipmentUpdateForm] = useState({
    lrn: '',
    payload: '',
    files: [],
    result: null,
  })
  const [delhiveryLtlShipmentUpdateStatusForm, setDelhiveryLtlShipmentUpdateStatusForm] =
    useState({
      jobId: '',
      result: null,
    })
  const [delhiveryLtlShipmentCancelForm, setDelhiveryLtlShipmentCancelForm] = useState({
    lrn: '',
    result: null,
  })
  const [delhiveryLtlShipmentTrackForm, setDelhiveryLtlShipmentTrackForm] = useState({
    lrn: '',
    allWbns: false,
    result: null,
  })
  const [delhiveryLtlLabelForm, setDelhiveryLtlLabelForm] = useState({
    size: 'std',
    lrn: '',
    result: null,
  })
  const [delhiveryLtlLrCopyForm, setDelhiveryLtlLrCopyForm] = useState({
    lrn: '',
    lrCopyType: '',
    requestId: '',
    result: null,
  })
  const [delhiveryLtlDocumentGenerateForm, setDelhiveryLtlDocumentGenerateForm] = useState({
    docType: 'shipping_label',
    requestId: '',
    payload: '',
    result: null,
  })
  const [delhiveryLtlDocumentStatusForm, setDelhiveryLtlDocumentStatusForm] = useState({
    docType: 'shipping_label',
    jobId: '',
    requestId: '',
    result: null,
  })
  const [delhiveryLtlAppointmentForm, setDelhiveryLtlAppointmentForm] = useState({
    lrn: '',
    date: '',
    appointmentSlot: '12:00 PM-03:00 PM',
    poNumbers: 'NotApplicable',
    appointmentId: '',
    poExpiryDate: '',
    result: null,
  })
  const [delhiveryLtlPickupCancelForm, setDelhiveryLtlPickupCancelForm] = useState({
    pickupId: '',
    requestId: '',
    result: null,
  })
  const [ekartForm, setEkartForm] = useState({
    apiBase: '',
    clientId: '',
    username: '',
    password: '',
    webhookSecret: '',
  })
  const [xpressbeesForm, setXpressbeesForm] = useState({
    apiBase: '',
    username: '',
    password: '',
    apiKey: '',
    authBearer: '',
    secretKey: '',
    xbKey: '',
    xbAccessKey: '',
    businessAccountName: '',
    pickupVendorCode: '',
    businessUnit: 'ECOM',
    businessFlow: 'FORWARD',
    businessService: '',
    businessServices: 'SD,SDD,NDD,AIR,SFC,IntraSDD',
    manifestServiceType: 'SD',
    manifestPickupType: 'Vendor',
    pincodeBusinessUnit: 'eComm',
    pincodeBusinessFlow: 'Forward',
    pickupBusinessService: 'PickUp',
    deliveryBusinessService: 'Delivery',
    serviceabilityVersion: 'v1',
    trackingVersion: 'v1',
    webhookSecret: '',
  })
  const [xpressbeesAwbForm, setXpressbeesAwbForm] = useState({
    startAwb: '',
    endAwb: '',
  })
  const [shadowfaxForm, setShadowfaxForm] = useState({
    apiBase: '',
    clientName: '',
    apiKey: '',
    webhookSecret: '',
  })
  const [velocityForm, setVelocityForm] = useState({
    apiBase: '',
    username: '',
    password: '',
    origin: '',
    destination: '',
    paymentMode: 'prepaid',
    shipmentType: 'forward',
  })
  const [amazonForm, setAmazonForm] = useState({
    apiBase: '',
    lwaClientId: '',
    lwaClientSecret: '',
    refreshToken: '',
    accessToken: '',
    shippingBusinessId: '',
    region: '',
    sandbox: false,
    lwaTokenUrl: '',
  })

  useEffect(() => {
    if (data?.delhivery) {
      setForm({
        apiBase: data.delhivery.apiBase || '',
        clientName: data.delhivery.clientName || '',
        apiKey: '',
        ltlApiBase: data.delhivery.ltlApiBase || 'https://ltl-clients-api.delhivery.com',
        ltlUsername: data.delhivery.ltlUsername || '',
        ltlPassword: '',
      })
    }
    if (data?.ekart) {
      setEkartForm({
        apiBase: data.ekart.apiBase || '',
        clientId: data.ekart.clientId || '',
        username: data.ekart.username || '',
        password: '',
        webhookSecret: '',
      })
    }
    if (data?.xpressbees) {
      setXpressbeesForm({
        apiBase: data.xpressbees.apiBase || '',
        username: data.xpressbees.username || '',
        password: '',
        apiKey: '',
        authBearer: '',
        secretKey: '',
        xbKey: '',
        xbAccessKey: '',
        businessAccountName: data.xpressbees.businessAccountName || '',
        pickupVendorCode: data.xpressbees.pickupVendorCode || '',
        businessUnit: data.xpressbees.businessUnit || 'ECOM',
        businessFlow: data.xpressbees.businessFlow || 'FORWARD',
        businessService: data.xpressbees.businessService || '',
        businessServices: data.xpressbees.businessServices || 'SD,SDD,NDD,AIR,SFC,IntraSDD',
        manifestServiceType: data.xpressbees.manifestServiceType || 'SD',
        manifestPickupType: data.xpressbees.manifestPickupType || 'Vendor',
        pincodeBusinessUnit: data.xpressbees.pincodeBusinessUnit || 'eComm',
        pincodeBusinessFlow: data.xpressbees.pincodeBusinessFlow || 'Forward',
        pickupBusinessService: data.xpressbees.pickupBusinessService || 'PickUp',
        deliveryBusinessService: data.xpressbees.deliveryBusinessService || 'Delivery',
        serviceabilityVersion: data.xpressbees.serviceabilityVersion || 'v1',
        trackingVersion: data.xpressbees.trackingVersion || 'v1',
        webhookSecret: '',
      })
    }
    if (data?.shadowfax) {
      setShadowfaxForm({
        apiBase: data.shadowfax.apiBase || '',
        clientName: data.shadowfax.clientName || '',
        apiKey: '',
        webhookSecret: '',
      })
    }
    if (data?.velocity) {
      setVelocityForm((prev) => ({
        ...prev,
        apiBase: data.velocity.apiBase || '',
        username: data.velocity.username || '',
        password: '',
      }))
    }
    if (data?.amazon) {
      setAmazonForm({
        apiBase: data.amazon.apiBase || data.amazon.endpoint || '',
        lwaClientId: data.amazon.lwaClientId || '',
        lwaClientSecret: '',
        refreshToken: '',
        accessToken: '',
        shippingBusinessId: data.amazon.shippingBusinessId || '',
        region: data.amazon.region || '',
        sandbox: Boolean(data.amazon.sandbox),
        lwaTokenUrl: data.amazon.lwaTokenUrl || '',
      })
    }
  }, [data])

  const handleSaveDelhivery = () => {
    updateDelhivery.mutate(
      {
        apiBase: form.apiBase,
        clientName: form.clientName,
        ...(form.apiKey ? { apiKey: form.apiKey } : {}),
        ltlApiBase: form.ltlApiBase,
        ltlUsername: form.ltlUsername,
        ...(form.ltlPassword ? { ltlPassword: form.ltlPassword } : {}),
      },
      {
        onSuccess: () => {
          toast({
            title: 'Delhivery credentials updated',
            status: 'success',
          })
          setForm((prev) => ({ ...prev, apiKey: '', ltlPassword: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleTestDelhivery = () => {
    testDelhivery.mutate(delhiveryB2CTest.pincode.trim(), {
      onSuccess: (result) => {
        setDelhiveryB2CTest((prev) => ({ ...prev, result }))
        toast({
          title: 'Delhivery B2C credentials are working',
          status: 'success',
        })
      },
      onError: (err) => {
        setDelhiveryB2CTest((prev) => ({ ...prev, result: null }))
        toast({
          title: 'Delhivery B2C credential test failed',
          description: err?.response?.data?.message || err?.message,
          status: 'error',
        })
      },
    })
  }

  const handleDelhiveryLtlLogin = () => {
    loginDelhiveryLtl.mutate(
      {
        username: form.ltlUsername,
        ...(form.ltlPassword ? { password: form.ltlPassword } : {}),
      },
      {
        onSuccess: (response) => {
          toast({
            title: 'Delhivery LTL token generated',
            description: response?.ltlTokenExpiresAt
              ? `Token cached until ${new Date(response.ltlTokenExpiresAt).toLocaleString()}.`
              : undefined,
            status: 'success',
          })
          setForm((prev) => ({ ...prev, ltlPassword: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to log in to Delhivery LTL',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleRequestDelhiveryLtlPasswordReset = () => {
    requestDelhiveryLtlPasswordReset.mutate(
      {
        username: form.ltlUsername,
      },
      {
        onSuccess: (response) => {
          toast({
            title: 'Delhivery LTL password reset requested',
            description: response?.username
              ? `Password reset was requested for ${response.username}.`
              : undefined,
            status: 'success',
          })
        },
        onError: (err) => {
          toast({
            title: 'Failed to request Delhivery LTL password reset',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleDelhiveryLtlLogout = () => {
    logoutDelhiveryLtl.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Delhivery LTL session logged out',
          status: 'success',
        })
      },
      onError: (err) => {
        toast({
          title: 'Failed to log out of Delhivery LTL',
          description: err?.message,
          status: 'error',
        })
      },
    })
  }

  const handleDelhiveryLtlServiceabilityCheck = () => {
    checkDelhiveryLtlServiceability.mutate(
      {
        pincode: delhiveryLtlServiceabilityForm.pincode,
        ...(delhiveryLtlServiceabilityForm.weight.trim()
          ? { weight: delhiveryLtlServiceabilityForm.weight.trim() }
          : {}),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlServiceabilityForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.serviceable
              ? 'Delhivery LTL pincode is serviceable'
              : 'Delhivery LTL serviceability fetched',
            status: response?.serviceable ? 'success' : 'info',
          })
        },
        onError: (err) => {
          setDelhiveryLtlServiceabilityForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL serviceability',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleDelhiveryLtlTatCheck = () => {
    getDelhiveryLtlExpectedTat.mutate(
      {
        origin_pin: delhiveryLtlTatForm.originPin.trim(),
        destination_pin: delhiveryLtlTatForm.destinationPin.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlTatForm((prev) => ({ ...prev, result: response }))
          toast({
            title:
              response?.tatDays !== null && response?.tatDays !== undefined
                ? `Delhivery LTL TAT: ${response.tatDays} day(s)`
                : 'Delhivery LTL expected TAT fetched',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlTatForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL expected TAT',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleDelhiveryLtlFreightEstimate = () => {
    estimateDelhiveryLtlFreight.mutate(
      {
        dimensions: [
          {
            length_cm: delhiveryLtlFreightForm.lengthCm.trim(),
            width_cm: delhiveryLtlFreightForm.widthCm.trim(),
            height_cm: delhiveryLtlFreightForm.heightCm.trim(),
            box_count: delhiveryLtlFreightForm.boxCount.trim() || '1',
          },
        ],
        weight_g: delhiveryLtlFreightForm.weightG.trim(),
        cheque_payment: delhiveryLtlFreightForm.chequePayment,
        source_pin: delhiveryLtlFreightForm.sourcePin.trim(),
        consignee_pin: delhiveryLtlFreightForm.consigneePin.trim(),
        payment_mode: delhiveryLtlFreightForm.paymentMode,
        ...(delhiveryLtlFreightForm.paymentMode === 'cod'
          ? { cod_amount: delhiveryLtlFreightForm.codAmount.trim() }
          : {}),
        inv_amount: delhiveryLtlFreightForm.invoiceAmount.trim(),
        freight_mode: delhiveryLtlFreightForm.freightMode.trim(),
        rov_insurance: delhiveryLtlFreightForm.rovInsurance,
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlFreightForm((prev) => ({ ...prev, result: response }))
          toast({
            title:
              response?.estimatedFreight !== null && response?.estimatedFreight !== undefined
                ? `Delhivery LTL estimate: ${response.estimatedFreight}`
                : 'Delhivery LTL freight estimate fetched',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlFreightForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL freight estimate',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleDelhiveryLtlFreightChargesLookup = () => {
    getDelhiveryLtlFreightCharges.mutate(
      {
        lrns: delhiveryLtlFreightChargesForm.lrns.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlFreightChargesForm((prev) => ({ ...prev, result: response }))
          toast({
            title: `Delhivery LTL freight charges fetched for ${response?.lrnCount || 0} LRN(s)`,
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlFreightChargesForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL freight charges',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleCreateDelhiveryLtlClientWarehouse = () => {
    let payload

    try {
      payload = JSON.parse(delhiveryLtlWarehouseForm.payload)
    } catch (err) {
      toast({
        title: 'Invalid warehouse JSON',
        description: 'Enter a valid JSON payload before creating the Delhivery LTL warehouse.',
        status: 'error',
      })
      return
    }

    createDelhiveryLtlClientWarehouse.mutate(payload, {
      onSuccess: (response) => {
        setDelhiveryLtlWarehouseForm((prev) => ({ ...prev, result: response }))
        toast({
          title: `Delhivery LTL warehouse created${response?.warehouseName ? `: ${response.warehouseName}` : ''}`,
          status: 'success',
        })
      },
      onError: (err) => {
        setDelhiveryLtlWarehouseForm((prev) => ({ ...prev, result: null }))
        toast({
          title: 'Failed to create Delhivery LTL warehouse',
          description: err?.message,
          status: 'error',
        })
      },
    })
  }

  const handleUpdateDelhiveryLtlClientWarehouse = () => {
    let payload

    try {
      payload = JSON.parse(delhiveryLtlWarehouseUpdateForm.payload)
    } catch (err) {
      toast({
        title: 'Invalid warehouse update JSON',
        description: 'Enter a valid JSON payload before updating the Delhivery LTL warehouse.',
        status: 'error',
      })
      return
    }

    updateDelhiveryLtlClientWarehouse.mutate(payload, {
      onSuccess: (response) => {
        setDelhiveryLtlWarehouseUpdateForm((prev) => ({ ...prev, result: response }))
        toast({
          title: `Delhivery LTL warehouse updated${response?.warehouseName ? `: ${response.warehouseName}` : ''}`,
          status: 'success',
        })
      },
      onError: (err) => {
        setDelhiveryLtlWarehouseUpdateForm((prev) => ({ ...prev, result: null }))
        toast({
          title: 'Failed to update Delhivery LTL warehouse',
          description: err?.message,
          status: 'error',
        })
      },
    })
  }

  const handleCreateDelhiveryLtlManifest = () => {
    let payload

    try {
      payload = JSON.parse(delhiveryLtlManifestForm.payload)
    } catch (err) {
      toast({
        title: 'Invalid shipment JSON',
        description: 'Enter a valid JSON payload before creating the Delhivery LTL shipment.',
        status: 'error',
      })
      return
    }

    createDelhiveryLtlManifest.mutate(
      {
        payload,
        files: delhiveryLtlManifestForm.files,
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlManifestForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.jobId
              ? `Delhivery LTL shipment submitted: ${response.jobId}`
              : 'Delhivery LTL shipment submitted',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlManifestForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to create Delhivery LTL shipment',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleGetDelhiveryLtlManifestStatus = () => {
    getDelhiveryLtlManifestStatus.mutate(
      {
        job_id: delhiveryLtlManifestStatusForm.jobId.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlManifestStatusForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.lrn
              ? `Delhivery LTL status fetched: ${response.lrn}`
              : 'Delhivery LTL shipment status fetched',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlManifestStatusForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL shipment status',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleUpdateDelhiveryLtlShipment = () => {
    let payload

    try {
      payload = JSON.parse(delhiveryLtlShipmentUpdateForm.payload)
    } catch (err) {
      toast({
        title: 'Invalid shipment update JSON',
        description: 'Enter a valid JSON payload before updating the Delhivery LTL shipment.',
        status: 'error',
      })
      return
    }

    updateDelhiveryLtlShipment.mutate(
      {
        lrn: delhiveryLtlShipmentUpdateForm.lrn.trim(),
        payload,
        files: delhiveryLtlShipmentUpdateForm.files,
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlShipmentUpdateForm((prev) => ({ ...prev, result: response }))
          toast({
            title: `Delhivery LTL shipment updated: ${response?.lrn || delhiveryLtlShipmentUpdateForm.lrn.trim()}`,
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlShipmentUpdateForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to update Delhivery LTL shipment',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleGetDelhiveryLtlShipmentUpdateStatus = () => {
    getDelhiveryLtlShipmentUpdateStatus.mutate(
      {
        job_id: delhiveryLtlShipmentUpdateStatusForm.jobId.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlShipmentUpdateStatusForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.status
              ? `Delhivery LTL update status: ${response.status}`
              : 'Delhivery LTL shipment update status fetched',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlShipmentUpdateStatusForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL shipment update status',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleCancelDelhiveryLtlShipment = () => {
    cancelDelhiveryLtlShipment.mutate(
      {
        lrn: delhiveryLtlShipmentCancelForm.lrn.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlShipmentCancelForm((prev) => ({ ...prev, result: response }))
          toast({
            title: `Delhivery LTL shipment cancelled: ${response?.lrn || delhiveryLtlShipmentCancelForm.lrn.trim()}`,
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlShipmentCancelForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to cancel Delhivery LTL shipment',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleTrackDelhiveryLtlShipment = () => {
    trackDelhiveryLtlShipment.mutate(
      {
        lrnum: delhiveryLtlShipmentTrackForm.lrn.trim(),
        ...(delhiveryLtlShipmentTrackForm.allWbns ? { all_wbns: true } : {}),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlShipmentTrackForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.status
              ? `Delhivery LTL tracking: ${response.status}`
              : 'Delhivery LTL shipment tracking fetched',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlShipmentTrackForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL shipment tracking',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleGetDelhiveryLtlShippingLabelUrls = () => {
    getDelhiveryLtlShippingLabelUrls.mutate(
      {
        size: delhiveryLtlLabelForm.size.trim().toLowerCase(),
        lrn: delhiveryLtlLabelForm.lrn.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlLabelForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.labelCount
              ? `Delhivery LTL labels fetched: ${response.labelCount}`
              : 'Delhivery LTL label URLs fetched',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlLabelForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL shipping label URLs',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleGetDelhiveryLtlLrCopy = () => {
    getDelhiveryLtlLrCopy.mutate(
      {
        lrn: delhiveryLtlLrCopyForm.lrn.trim(),
        lrCopyType: delhiveryLtlLrCopyForm.lrCopyType.trim(),
        requestId: delhiveryLtlLrCopyForm.requestId.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlLrCopyForm((prev) => ({ ...prev, result: response }))
          toast({
            title: `Delhivery LTL LR copy fetched: ${response?.lrn || delhiveryLtlLrCopyForm.lrn.trim()}`,
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlLrCopyForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL LR copy',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleGenerateDelhiveryLtlDocuments = () => {
    let payload

    try {
      payload = JSON.parse(delhiveryLtlDocumentGenerateForm.payload)
    } catch (err) {
      toast({
        title: 'Invalid document generation JSON',
        description: 'Enter a valid JSON payload before generating Delhivery LTL documents.',
        status: 'error',
      })
      return
    }

    generateDelhiveryLtlDocuments.mutate(
      {
        docType: delhiveryLtlDocumentGenerateForm.docType.trim(),
        requestId: delhiveryLtlDocumentGenerateForm.requestId.trim(),
        payload,
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlDocumentGenerateForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.jobId
              ? `Delhivery LTL document job submitted: ${response.jobId}`
              : 'Delhivery LTL document generation submitted',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlDocumentGenerateForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to generate Delhivery LTL documents',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleGetDelhiveryLtlGeneratedDocumentStatus = () => {
    getDelhiveryLtlGeneratedDocumentStatus.mutate(
      {
        docType: delhiveryLtlDocumentStatusForm.docType.trim(),
        jobId: delhiveryLtlDocumentStatusForm.jobId.trim(),
        requestId: delhiveryLtlDocumentStatusForm.requestId.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlDocumentStatusForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.status
              ? `Delhivery LTL document status: ${response.status}`
              : 'Delhivery LTL document status fetched',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlDocumentStatusForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to fetch Delhivery LTL document status',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleBookDelhiveryLtlLastMileAppointment = () => {
    const poNumbers = delhiveryLtlAppointmentForm.poNumbers
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)

    bookDelhiveryLtlLastMileAppointment.mutate(
      {
        lrn: delhiveryLtlAppointmentForm.lrn.trim(),
        date: delhiveryLtlAppointmentForm.date.trim(),
        appointment_slot: delhiveryLtlAppointmentForm.appointmentSlot,
        po_number: poNumbers,
        ...(delhiveryLtlAppointmentForm.appointmentId.trim()
          ? { appointment_id: delhiveryLtlAppointmentForm.appointmentId.trim() }
          : {}),
        po_expiry_date: delhiveryLtlAppointmentForm.poExpiryDate.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlAppointmentForm((prev) => ({ ...prev, result: response }))
          toast({
            title: response?.status
              ? `Delhivery LTL appointment booked: ${response.status}`
              : 'Delhivery LTL appointment booked',
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlAppointmentForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to book Delhivery LTL appointment',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleCancelDelhiveryLtlPickupRequest = () => {
    cancelDelhiveryLtlPickupRequest.mutate(
      {
        pickupId: delhiveryLtlPickupCancelForm.pickupId.trim(),
        requestId: delhiveryLtlPickupCancelForm.requestId.trim(),
      },
      {
        onSuccess: (response) => {
          setDelhiveryLtlPickupCancelForm((prev) => ({ ...prev, result: response }))
          toast({
            title: `Delhivery LTL pickup cancelled: ${response?.pickupId || delhiveryLtlPickupCancelForm.pickupId.trim()}`,
            status: 'success',
          })
        },
        onError: (err) => {
          setDelhiveryLtlPickupCancelForm((prev) => ({ ...prev, result: null }))
          toast({
            title: 'Failed to cancel Delhivery LTL pickup request',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleOpenPdfDataUrl = (dataUrl, fileName) => {
    if (!dataUrl) return

    const link = document.createElement('a')
    link.href = dataUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.download = fileName || 'delhivery-ltl-document.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyWebhookUrl = async (value, label) => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      toast({ title: `${label} copied`, status: 'success' })
    } catch (err) {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast({ title: `${label} copied`, status: 'success' })
    }
  }

  const handleSaveEkart = () => {
    updateEkart.mutate(
      {
        apiBase: ekartForm.apiBase,
        clientId: ekartForm.clientId,
        username: ekartForm.username,
        ...(ekartForm.password ? { password: ekartForm.password } : {}),
        ...(ekartForm.webhookSecret ? { webhookSecret: ekartForm.webhookSecret } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Ekart credentials updated', status: 'success' })
          setEkartForm((prev) => ({ ...prev, password: '', webhookSecret: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Ekart credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveXpressbees = () => {
    updateXpressbees.mutate(
      {
        apiBase: xpressbeesForm.apiBase,
        username: xpressbeesForm.username,
        ...(xpressbeesForm.password ? { password: xpressbeesForm.password } : {}),
        ...(xpressbeesForm.apiKey ? { apiKey: xpressbeesForm.apiKey } : {}),
        ...(xpressbeesForm.authBearer ? { authBearer: xpressbeesForm.authBearer } : {}),
        ...(xpressbeesForm.secretKey ? { secretKey: xpressbeesForm.secretKey } : {}),
        ...(xpressbeesForm.xbKey ? { xbKey: xpressbeesForm.xbKey } : {}),
        ...(xpressbeesForm.xbAccessKey ? { xbAccessKey: xpressbeesForm.xbAccessKey } : {}),
        businessAccountName: xpressbeesForm.businessAccountName,
        pickupVendorCode: xpressbeesForm.pickupVendorCode,
        businessUnit: xpressbeesForm.businessUnit,
        businessFlow: xpressbeesForm.businessFlow,
        businessService: xpressbeesForm.businessService,
        businessServices: xpressbeesForm.businessServices,
        manifestServiceType: xpressbeesForm.manifestServiceType,
        manifestPickupType: xpressbeesForm.manifestPickupType,
        pincodeBusinessUnit: xpressbeesForm.pincodeBusinessUnit,
        pincodeBusinessFlow: xpressbeesForm.pincodeBusinessFlow,
        pickupBusinessService: xpressbeesForm.pickupBusinessService,
        deliveryBusinessService: xpressbeesForm.deliveryBusinessService,
        serviceabilityVersion: xpressbeesForm.serviceabilityVersion,
        trackingVersion: xpressbeesForm.trackingVersion,
        ...(xpressbeesForm.webhookSecret
          ? { webhookSecret: xpressbeesForm.webhookSecret }
          : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Xpressbees credentials updated', status: 'success' })
          setXpressbeesForm((prev) => ({
            ...prev,
            password: '',
            apiKey: '',
            authBearer: '',
            secretKey: '',
            xbKey: '',
            xbAccessKey: '',
            webhookSecret: '',
          }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Xpressbees credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveXpressbeesAwbRange = () => {
    const startAwb = xpressbeesAwbForm.startAwb.trim()
    const endAwb = xpressbeesAwbForm.endAwb.trim()

    if (!startAwb || !endAwb) {
      toast({
        title: 'AWB range required',
        description: 'Enter both starting and ending AWB numbers.',
        status: 'warning',
      })
      return
    }

    updateXpressbeesAwbRange.mutate(
      { startAwb, endAwb },
      {
        onSuccess: () => {
          toast({ title: 'Xpressbees AWB range updated', status: 'success' })
          setXpressbeesAwbForm({ startAwb: '', endAwb: '' })
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Xpressbees AWB range',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveShadowfax = () => {
    updateShadowfax.mutate(
      {
        apiBase: shadowfaxForm.apiBase,
        clientName: shadowfaxForm.clientName,
        ...(shadowfaxForm.apiKey ? { apiKey: shadowfaxForm.apiKey } : {}),
        ...(shadowfaxForm.webhookSecret ? { webhookSecret: shadowfaxForm.webhookSecret } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Shadowfax credentials updated', status: 'success' })
          setShadowfaxForm((prev) => ({ ...prev, apiKey: '', webhookSecret: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Shadowfax credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveVelocity = () => {
    updateVelocity.mutate(
      {
        username: velocityForm.username,
        ...(velocityForm.password ? { password: velocityForm.password } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Velocity credentials updated', status: 'success' })
          setVelocityForm((prev) => ({ ...prev, password: '' }))
        },
        onError: (err) => toast({ title: 'Failed to update Velocity credentials', description: err?.message, status: 'error' }),
      },
    )
  }

  const handleTestVelocity = () => {
    testVelocity.mutate(undefined, {
      onSuccess: (result) => toast({ title: 'Velocity authentication succeeded', description: result?.expiresAt ? `Token expires ${new Date(result.expiresAt).toLocaleString()}` : undefined, status: 'success' }),
      onError: (err) => toast({ title: 'Velocity authentication failed', description: err?.message, status: 'error' }),
    })
  }

  const handleSaveAmazon = () => {
    updateAmazon.mutate(
      {
        apiBase: amazonForm.apiBase,
        lwaClientId: amazonForm.lwaClientId,
        shippingBusinessId: amazonForm.shippingBusinessId,
        region: amazonForm.region,
        sandbox: amazonForm.sandbox,
        lwaTokenUrl: amazonForm.lwaTokenUrl,
        ...(amazonForm.lwaClientSecret ? { lwaClientSecret: amazonForm.lwaClientSecret } : {}),
        ...(amazonForm.refreshToken ? { refreshToken: amazonForm.refreshToken } : {}),
        ...(amazonForm.accessToken ? { accessToken: amazonForm.accessToken } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Amazon credentials updated', status: 'success' })
          setAmazonForm((prev) => ({
            ...prev,
            lwaClientSecret: '',
            refreshToken: '',
            accessToken: '',
          }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Amazon credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  if (isLoading) return <Spinner size="md" />
  if (error) return <Text color="red.500">Failed to load courier credentials</Text>

  const xpressbeesManualAwb = data?.xpressbees?.manualAwb || {}
  const xpressbeesAwbRange = xpressbeesManualAwb?.range || null
  const xpressbeesAwbStatus = xpressbeesManualAwb?.active
    ? 'Active'
    : xpressbeesManualAwb?.configured
      ? 'Inactive'
      : 'Not configured'
  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <Text fontSize="xl" fontWeight="bold">
        Courier Credentials
      </Text>

      <Flex gap={4} flexWrap="wrap">
        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" mb={{ base: 4, md: 0 }}>
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">SME Courier • FedEx Direct</Text>
              <Badge colorScheme={smeStatus?.configured ? 'green' : 'orange'}>
                {smeStatus?.configured ? (smeStatus.bookingReady ? 'B2C booking ready' : 'Connected') : 'Missing credentials'}
              </Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600">SME API login and service settings used for direct international shipment booking.</Text>
            <FormControl>
              <FormLabel>SME username</FormLabel>
              <Input autoComplete="off" value={smeCredentials.username} onChange={(event) => setSmeCredentials((current) => ({ ...current, username: event.target.value }))} placeholder={smeStatus?.configured ? 'Enter username to update' : 'Enter SME Courier username'} />
            </FormControl>
            <FormControl>
              <FormLabel>Password {smeStatus?.configured ? '(leave blank to keep saved password)' : ''}</FormLabel>
              <Input type="password" autoComplete="new-password" value={smeCredentials.password} onChange={(event) => setSmeCredentials((current) => ({ ...current, password: event.target.value }))} placeholder={smeStatus?.configured ? 'Saved securely; never displayed' : 'Enter SME Courier password'} />
            </FormControl>
            <FormControl>
              <FormLabel>Service code</FormLabel>
              <Input value={smeCredentials.serviceCode} onChange={(event) => setSmeCredentials((current) => ({ ...current, serviceCode: event.target.value }))} />
            </FormControl>
            <Flex gap={3} flexWrap="wrap">
              <Button colorScheme="blue" onClick={handleSaveSMECredentials} isLoading={smeSaving}>Verify &amp; Save SME Credentials</Button>
              <Button as={RouterLink} to="/admin/pricing/b2c" variant="outline">B2C Rates</Button>
              <Button as={RouterLink} to="/admin/pricing/b2b" variant="outline">B2B Rates</Button>
            </Flex>
          </VStack>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" mb={{ base: 4, md: 0 }}>
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">M5C Logistics</Text>
              <Badge colorScheme={m5cStatus?.bookingReady ? 'green' : 'gray'}>{m5cStatus?.status || 'Setup needed'}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600">Live account services and real international B2C/B2B AWB booking use the M5C production API. Secrets stay on the PunjabShip server.</Text>
            <Flex gap={3} flexWrap="wrap">
              <FormControl flex="1"><FormLabel>Account code</FormLabel><Input autoComplete="off" value={m5cCredentials.accountCode} onChange={(event) => setM5CCredentials((current) => ({ ...current, accountCode: event.target.value }))} placeholder={m5cStatus?.configured ? 'Configured; enter only to change' : 'M5C account code'} /></FormControl>
              <FormControl flex="1"><FormLabel>API username</FormLabel><Input autoComplete="off" value={m5cCredentials.username} onChange={(event) => setM5CCredentials((current) => ({ ...current, username: event.target.value }))} placeholder={m5cStatus?.configured ? 'Configured; enter only to change' : 'M5C API username'} /></FormControl>
            </Flex>
            <FormControl><FormLabel>Password {m5cStatus?.configured ? '(blank keeps saved password)' : ''}</FormLabel><Input type="password" autoComplete="new-password" value={m5cCredentials.password} onChange={(event) => setM5CCredentials((current) => ({ ...current, password: event.target.value }))} placeholder={m5cStatus?.configured ? 'Saved securely; never displayed' : 'M5C API password'} /></FormControl>
            <FormControl><FormLabel>Access key {m5cStatus?.configured ? '(blank keeps saved key)' : ''}</FormLabel><Input type="password" autoComplete="new-password" value={m5cCredentials.accessKey} onChange={(event) => setM5CCredentials((current) => ({ ...current, accessKey: event.target.value }))} placeholder={m5cStatus?.configured ? 'Saved securely; never displayed' : 'M5C API access key'} /></FormControl>
            <Flex gap={3} flexWrap="wrap">
              <FormControl flex="1"><FormLabel>KYC type</FormLabel><Input value={m5cCredentials.kycType} onChange={(event) => setM5CCredentials((current) => ({ ...current, kycType: event.target.value }))} placeholder="GST Number" /></FormControl>
              <FormControl flex="1"><FormLabel>Default KYC number (optional)</FormLabel><Input value={m5cCredentials.kycNumber} onChange={(event) => setM5CCredentials((current) => ({ ...current, kycNumber: event.target.value }))} placeholder={m5cStatus?.settings?.kycNumberConfigured ? 'Configured; blank keeps saved value' : 'Uses seller GST/PAN when blank'} /></FormControl>
            </Flex>
            <Text fontSize="xs" color="gray.600">M5C's documented API has no live rate endpoint. PunjabShip B2C/B2B selling rates are editable in admin pricing; the service codes are loaded from the live M5C account.</Text>
            {m5cStatus?.services?.length > 0 && <Text fontSize="xs" color="gray.600">Live services: {m5cStatus.services.map((service) => `${service.Code} - ${service.Name}`).join(', ')}</Text>}
            {m5cStatus?.note && <Text fontSize="xs" color="gray.600">{m5cStatus.note}</Text>}
            <Flex gap={3} flexWrap="wrap"><Button colorScheme="blue" onClick={handleSaveM5CCredentials} isLoading={m5cSaving}>Verify &amp; Save M5C Credentials</Button><Button as={RouterLink} to="/admin/pricing/b2c" variant="outline">B2C Rates</Button><Button as={RouterLink} to="/admin/pricing/b2b" variant="outline">B2B Rates</Button></Flex>
          </VStack>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" mb={{ base: 4, md: 0 }}>
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Skylink International</Text>
              <Badge colorScheme={skylinkStatus?.bookingReady ? 'green' : skylinkStatus?.configured ? 'orange' : 'gray'}>
                {skylinkStatus?.bookingReady ? 'Connected' : skylinkStatus?.configured ? 'Invoice type required' : 'Setup needed'}
              </Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600">Live rates are requested for the order route. Credentials stay on the PunjabShip server; shipment creation runs only when a user books an order.</Text>
            <FormControl>
              <FormLabel>Skylink login email</FormLabel>
              <Input type="email" autoComplete="off" value={skylinkCredentials.email} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, email: event.target.value }))} placeholder={skylinkStatus?.configured ? 'Configured; enter only to change' : 'API login email'} />
            </FormControl>
            <FormControl>
              <FormLabel>Password {skylinkStatus?.configured ? '(blank keeps saved password)' : ''}</FormLabel>
              <Input type="password" autoComplete="new-password" value={skylinkCredentials.password} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, password: event.target.value }))} placeholder={skylinkStatus?.configured ? 'Saved securely; never displayed' : 'API login password'} />
            </FormControl>
            <FormControl>
              <FormLabel>Customer code</FormLabel>
              <Input autoComplete="off" value={skylinkCredentials.customerCode} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, customerCode: event.target.value }))} placeholder={skylinkStatus?.configured ? 'Blank keeps saved customer code' : 'Skylink customer code'} />
            </FormControl>
            <Flex gap={3} flexWrap="wrap">
              <FormControl flex="1" minW="140px">
                <FormLabel>API company ID</FormLabel>
                <Input value={skylinkCredentials.companyId} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, companyId: event.target.value }))} />
              </FormControl>
              <FormControl flex="1" minW="140px">
                <FormLabel>Rate origin code (optional)</FormLabel>
                <Input value={skylinkCredentials.rateOriginCode} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, rateOriginCode: event.target.value }))} placeholder="Blank uses pickup PIN" />
              </FormControl>
            </Flex>
            <Flex gap={3} flexWrap="wrap">
              <FormControl flex="1" minW="140px">
                <FormLabel>Product code</FormLabel>
                <Select value={skylinkCredentials.productCode} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, productCode: event.target.value }))}>
                  <option value="NONDOX">NONDOX (parcel)</option>
                  <option value="DOX">DOX (documents)</option>
                </Select>
              </FormControl>
              <FormControl flex="1" minW="140px">
                <FormLabel>Free-form invoice type</FormLabel>
                <Select value={skylinkCredentials.invoiceTypeId || '1'} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, invoiceTypeId: event.target.value }))}>
                  <option value="1">INVOICE (standard commercial invoice)</option>
                  <option value="2">PROFORMA INVOICE</option>
                </Select>
              </FormControl>
            </Flex>
            <Flex gap={3} flexWrap="wrap">
              <FormControl flex="1" minW="140px">
                <FormLabel>Terms of trade</FormLabel>
                <Select value={skylinkCredentials.termsOfTrade} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, termsOfTrade: event.target.value }))}>
                  <option value="DDU">DDU</option><option value="DDP">DDP</option>
                </Select>
              </FormControl>
              <FormControl flex="1" minW="140px">
                <FormLabel>Invoice purpose</FormLabel>
                <Select value={skylinkCredentials.invoiceNoteCode} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, invoiceNoteCode: event.target.value }))}>
                  <option value="COMMERCIAL">COMMERCIAL</option><option value="GIFT">GIFT</option><option value="SAMPLE">SAMPLE</option>
                </Select>
              </FormControl>
            </Flex>
            <FormControl>
              <FormLabel>Rate API username override (optional)</FormLabel>
              <Input autoComplete="off" value={skylinkCredentials.rateUsername} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, rateUsername: event.target.value }))} placeholder="Blank uses login email" />
            </FormControl>
            <FormControl>
              <FormLabel>Rate API password override (optional)</FormLabel>
              <Input type="password" autoComplete="new-password" value={skylinkCredentials.ratePassword} onChange={(event) => setSkylinkCredentials((current) => ({ ...current, ratePassword: event.target.value }))} placeholder="Blank reuses login password" />
            </FormControl>
            <Text fontSize="xs" color="gray.600">Skylink’s API requires a free-form invoice type ID for itemized NONDOX bookings. Add the exact ID from your Skylink account; it is not listed in the supplied API reference.</Text>
            {skylinkStatus?.note && <Text fontSize="xs" color="gray.600">{skylinkStatus.note}</Text>}
            <Button colorScheme="blue" onClick={handleSaveSkylinkCredentials} isLoading={skylinkSaving}>Verify &amp; Save Skylink Credentials</Button>
          </VStack>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" mb={{ base: 4, md: 0 }}>
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">FlightGo Express</Text>
              <Badge colorScheme={flightGoStatus?.configured ? flightGoStatus?.environment === 'production' ? 'green' : 'orange' : 'gray'}>
                {flightGoStatus?.status || 'Setup needed'}
              </Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600">Live international rates and labels use FlightGo's API. Secrets stay on the PunjabShip server.</Text>
            <FormControl><FormLabel>API username</FormLabel><Input autoComplete="off" value={flightGoCredentials.username} onChange={(event) => setFlightGoCredentials((current) => ({ ...current, username: event.target.value }))} placeholder={flightGoStatus?.configured ? 'Configured; enter only to change' : 'FlightGo API username'} /></FormControl>
            <FormControl><FormLabel>Password {flightGoStatus?.configured ? '(blank keeps saved password)' : ''}</FormLabel><Input type="password" autoComplete="new-password" value={flightGoCredentials.password} onChange={(event) => setFlightGoCredentials((current) => ({ ...current, password: event.target.value }))} placeholder={flightGoStatus?.configured ? 'Saved securely; never displayed' : 'FlightGo API password'} /></FormControl>
            <FormControl><FormLabel>API access key {flightGoStatus?.configured ? '(blank keeps saved key)' : ''}</FormLabel><Input type="password" autoComplete="new-password" value={flightGoCredentials.apiKey} onChange={(event) => setFlightGoCredentials((current) => ({ ...current, apiKey: event.target.value }))} placeholder={flightGoStatus?.configured ? 'Saved securely; never displayed' : 'FlightGo API access key'} /></FormControl>
            <Flex gap={3} flexWrap="wrap">
              <FormControl flex="1"><FormLabel>Package type</FormLabel><Select value={flightGoCredentials.packageCode} onChange={(event) => setFlightGoCredentials((current) => ({ ...current, packageCode: event.target.value }))}><option value="NDX">NDX (parcel)</option><option value="DOC">DOC (documents)</option></Select></FormControl>
              <FormControl flex="1"><FormLabel>Environment</FormLabel><Select value={flightGoCredentials.environment} onChange={(event) => setFlightGoCredentials((current) => ({ ...current, environment: event.target.value }))}><option value="test">Test</option><option value="production">Production</option></Select></FormControl>
            </Flex>
            {flightGoStatus?.note && <Text fontSize="xs" color="gray.600">{flightGoStatus.note}</Text>}
            <Flex gap={3} flexWrap="wrap"><Button colorScheme="blue" onClick={handleSaveFlightGoCredentials} isLoading={flightGoSaving}>Verify &amp; Save FlightGo Credentials</Button><Button as={RouterLink} to="/admin/pricing/b2c" variant="outline">B2C Rates</Button><Button as={RouterLink} to="/admin/pricing/b2b" variant="outline">B2B Rates</Button></Flex>
          </VStack>
        </Box>
        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" mb={{ base: 4, md: 0 }}>
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Dilliking International</Text>
              <Badge colorScheme={dillikingStatus?.bookingReady ? 'green' : dillikingStatus?.configured ? 'orange' : 'gray'}>{dillikingStatus?.status || 'Setup needed'}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600">Production AWB booking and tracking use api.dilliking.com. Credentials and seller KYC documents stay on the PunjabShip server.</Text>
            <FormControl><FormLabel>Production login email</FormLabel><Input type="email" autoComplete="off" value={dillikingCredentials.email} onChange={(event) => setDillikingCredentials((current) => ({ ...current, email: event.target.value }))} placeholder={dillikingStatus?.configured ? 'Configured; enter only to change' : 'Dilliking production email'} /></FormControl>
            <FormControl><FormLabel>Password {dillikingStatus?.configured ? '(blank keeps saved password)' : ''}</FormLabel><Input type="password" autoComplete="new-password" value={dillikingCredentials.password} onChange={(event) => setDillikingCredentials((current) => ({ ...current, password: event.target.value }))} placeholder={dillikingStatus?.configured ? 'Saved securely; never displayed' : 'Dilliking production password'} /></FormControl>
            <Flex gap={3} flexWrap="wrap">
              <FormControl flex="1"><FormLabel>Package type</FormLabel><Select value={dillikingCredentials.pcsType} onChange={(event) => setDillikingCredentials((current) => ({ ...current, pcsType: event.target.value }))}><option value="SPX">SPX (parcel)</option><option value="DOX">DOX (documents)</option></Select></FormControl>
              <FormControl flex="1"><FormLabel>Environment</FormLabel><Select value={dillikingCredentials.environment} onChange={(event) => setDillikingCredentials((current) => ({ ...current, environment: event.target.value }))}><option value="production">Production</option><option value="sandbox">Sandbox (bookings disabled)</option></Select></FormControl>
            </Flex>
            <Text fontSize="xs" color="gray.600">Dilliking does not document a rate API. PunjabShip B2C/B2B starter rates are editable estimates; AWB creation and tracking are live after production credentials are verified.</Text>
            {dillikingStatus?.note && <Text fontSize="xs" color="gray.600">{dillikingStatus.note}</Text>}
            <Flex gap={3} flexWrap="wrap"><Button colorScheme="blue" onClick={handleSaveDillikingCredentials} isLoading={dillikingSaving}>Verify &amp; Save Dilliking Credentials</Button><Button as={RouterLink} to="/admin/pricing/b2c" variant="outline">B2C Rates</Button><Button as={RouterLink} to="/admin/pricing/b2b" variant="outline">B2B Rates</Button></Flex>
          </VStack>
        </Box>
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={5}
          minW="320px"
          flex="1"
          maxW="520px"
          mb={{ base: 4, md: 0 }}
        >
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Delhivery B2C</Text>
              <Badge colorScheme={data?.delhivery?.hasApiKey ? 'green' : 'orange'}>
                {data?.delhivery?.hasApiKey ? 'Configured' : 'Missing API Key'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={form.apiBase}
                onChange={(e) => setForm((prev) => ({ ...prev, apiBase: e.target.value }))}
                placeholder="https://track.delhivery.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Client Name</FormLabel>
              <Input
                value={form.clientName}
                onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))}
                placeholder="Your Delhivery client name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>API Key</FormLabel>
              <Input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={data?.delhivery?.apiKeyMasked || 'Enter Delhivery API key'}
              />
              {!!data?.delhivery?.apiKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current key: {data.delhivery.apiKeyMasked}
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Standard Delhivery B2C credentials. Leave the API key blank to keep the existing
              secret.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveDelhivery}
              isLoading={updateDelhivery.isPending}
              alignSelf="flex-start"
            >
              Save Delhivery B2C Credentials
            </Button>

            <FormControl>
              <FormLabel>Test Pincode</FormLabel>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={delhiveryB2CTest.pincode}
                onChange={(e) =>
                  setDelhiveryB2CTest((prev) => ({
                    ...prev,
                    pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                    result: null,
                  }))
                }
                placeholder="110001"
              />
            </FormControl>

            <Button
              variant="outline"
              colorScheme="green"
              onClick={handleTestDelhivery}
              isLoading={testDelhivery.isPending}
              isDisabled={
                !data?.delhivery?.hasApiKey || !/^\d{6}$/.test(delhiveryB2CTest.pincode)
              }
              alignSelf="flex-start"
            >
              Test Delhivery B2C Credentials
            </Button>

            {delhiveryB2CTest.result && (
              <Box bg="green.50" borderWidth="1px" borderColor="green.200" p={3}>
                <Text fontSize="sm" fontWeight="semibold" color="green.700">
                  Connection successful for pincode {delhiveryB2CTest.result.pincode}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>

        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={5}
          minW="320px"
          flex="1"
          maxW="520px"
          mb={{ base: 4, md: 0 }}
          display="none"
        >
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Delhivery B2B (LTL)</Text>
              <Badge colorScheme={data?.delhivery?.ltlUsername ? 'green' : 'orange'}>
                {data?.delhivery?.ltlUsername ? 'Configured' : 'Missing LTL Login'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>LTL API Base URL</FormLabel>
              <Input
                value={form.ltlApiBase}
                onChange={(e) => setForm((prev) => ({ ...prev, ltlApiBase: e.target.value }))}
                placeholder="https://ltl-clients-api.delhivery.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>LTL Username</FormLabel>
              <Input
                value={form.ltlUsername}
                onChange={(e) => setForm((prev) => ({ ...prev, ltlUsername: e.target.value }))}
                placeholder="Registered Delhivery LTL username"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Used for Delhivery LTL authentication flows like forgot-password and token login.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>LTL Password</FormLabel>
              <Input
                type="password"
                value={form.ltlPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, ltlPassword: e.target.value }))}
                placeholder={
                  data?.delhivery?.hasLtlPassword
                    ? 'Leave blank to keep the saved LTL password'
                    : 'Enter Delhivery LTL password'
                }
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Leave this blank while saving to keep the current password. Delhivery locks the user
                for 10 minutes after repeated invalid login attempts.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>LTL Token Status</FormLabel>
              <Input
                value={
                  data?.delhivery?.hasLtlToken
                    ? `${data?.delhivery?.ltlTokenMasked || 'Stored token'}${
                        data?.delhivery?.ltlTokenExpiresAt
                          ? ` (expires ${new Date(data.delhivery.ltlTokenExpiresAt).toLocaleString()})`
                          : ''
                      }`
                    : 'No cached LTL token'
                }
                isReadOnly
                fontSize="sm"
              />
            </FormControl>

            <Box borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
              <Text fontSize="sm" fontWeight="semibold">
                LTL Auth Only
              </Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                This card now keeps only the fields required to authenticate with Delhivery LTL:
                base URL, username, password, and session actions.
              </Text>
              <Text fontSize="xs" color="gray.600" mt={2}>
                Save credentials first, then generate or clear the cached token from the buttons
                below when needed.
              </Text>
            </Box>

            <Text fontSize="xs" color="gray.500">
              Delhivery B2B / LTL settings. Leave the LTL password blank to keep the existing
              secret, and save after updating the LTL API base or login details.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveDelhivery}
              isLoading={updateDelhivery.isPending}
              alignSelf="flex-start"
            >
              Save Delhivery B2B Credentials
            </Button>

            <Button
              variant="solid"
              colorScheme="teal"
              onClick={handleDelhiveryLtlLogin}
              isLoading={loginDelhiveryLtl.isPending}
              isDisabled={
                !form.ltlUsername.trim() ||
                (!form.ltlPassword.trim() && !data?.delhivery?.hasLtlPassword)
              }
              alignSelf="flex-start"
            >
              Generate LTL Token
            </Button>

            <Button
              variant="ghost"
              colorScheme="red"
              onClick={handleDelhiveryLtlLogout}
              isLoading={logoutDelhiveryLtl.isPending}
              isDisabled={!data?.delhivery?.hasLtlToken}
              alignSelf="flex-start"
            >
              Logout LTL Session
            </Button>

            <Button
              variant="outline"
              colorScheme="orange"
              onClick={handleRequestDelhiveryLtlPasswordReset}
              isLoading={requestDelhiveryLtlPasswordReset.isPending}
              isDisabled={!form.ltlUsername.trim()}
              alignSelf="flex-start"
            >
              Send LTL Password Reset
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Velocity Shipping</Text>
              <Badge colorScheme={data?.velocity?.hasPassword ? 'green' : 'orange'}>
                {data?.velocity?.hasPassword ? 'Credentials set' : 'Missing password'}
              </Badge>
            </Flex>

            <Text fontSize="sm" color="gray.600">
              Uses the Velocity custom API login with username and password.
            </Text>

            <FormControl isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                value={velocityForm.username}
                onChange={(e) => setVelocityForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Velocity account username"
              />
            </FormControl>

            <FormControl isRequired={!data?.velocity?.hasPassword}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={velocityForm.password}
                onChange={(e) => setVelocityForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={data?.velocity?.hasPassword ? 'Leave blank to keep saved password' : 'Velocity account password'}
              />
            </FormControl>

            <Flex gap={2} flexWrap="wrap">
              <Button colorScheme="blue" onClick={handleSaveVelocity} isLoading={updateVelocity.isPending}>
                Save Velocity Credentials
              </Button>
              <Button
                variant="outline"
                colorScheme="green"
                onClick={handleTestVelocity}
                isLoading={testVelocity.isPending}
                isDisabled={(!data?.velocity?.hasPassword && !velocityForm.password) || !velocityForm.username}
              >
                Test Login
              </Button>
            </Flex>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" display="none">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Shadowfax</Text>
              <Badge colorScheme={data?.shadowfax?.hasApiKey ? 'green' : 'orange'}>
                {data?.shadowfax?.hasApiKey ? 'Configured' : 'Missing API Key'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={shadowfaxForm.apiBase}
                onChange={(e) =>
                  setShadowfaxForm((prev) => ({ ...prev, apiBase: e.target.value }))
                }
                placeholder="https://dale.staging.shadowfax.in/api"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Client Name</FormLabel>
              <Input
                value={shadowfaxForm.clientName}
                onChange={(e) =>
                  setShadowfaxForm((prev) => ({ ...prev, clientName: e.target.value }))
                }
                placeholder="Your Shadowfax client/account name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>API Token</FormLabel>
              <Input
                type="password"
                value={shadowfaxForm.apiKey}
                onChange={(e) =>
                  setShadowfaxForm((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder={data?.shadowfax?.apiKeyMasked || 'Enter Shadowfax API token'}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Webhook Secret</FormLabel>
              <Input
                type="password"
                value={shadowfaxForm.webhookSecret}
                onChange={(e) =>
                  setShadowfaxForm((prev) => ({ ...prev, webhookSecret: e.target.value }))
                }
                placeholder="Optional shared webhook secret"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleSaveShadowfax}
              isLoading={updateShadowfax.isPending}
              alignSelf="flex-start"
            >
              Save Shadowfax Credentials
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" display="none">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Ekart Logistics</Text>
              <Badge colorScheme={data?.ekart?.hasPassword ? 'green' : 'orange'}>
                {data?.ekart?.hasPassword ? 'Credentials set' : 'Missing password'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={ekartForm.apiBase}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, apiBase: e.target.value }))}
                placeholder="https://api.ekartlogistics.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Client ID</FormLabel>
              <Input
                value={ekartForm.clientId}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, clientId: e.target.value }))}
                placeholder="Your Ekart client ID"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input
                value={ekartForm.username}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Ekart username"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={ekartForm.password}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter Ekart password (saved securely)"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Webhook Secret</FormLabel>
              <Input
                type="password"
                value={ekartForm.webhookSecret}
                onChange={(e) =>
                  setEkartForm((prev) => ({ ...prev, webhookSecret: e.target.value }))
                }
                placeholder="Leave blank to keep existing webhook secret"
              />
              {data?.ekart?.hasWebhookSecret && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Webhook secret already configured on Ekart.
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Ekart requires client ID + username/password for token generation. Leave password blank to keep the saved secret.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveEkart}
              isLoading={updateEkart.isPending}
              alignSelf="flex-start"
            >
              Save Ekart Credentials
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" display="none">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Xpressbees</Text>
              <Badge
                colorScheme={
                  data?.xpressbees?.hasApiKey ||
                  (data?.xpressbees?.hasPassword && data?.xpressbees?.hasSecretKey)
                    ? 'green'
                    : 'orange'
                }
              >
                {data?.xpressbees?.hasApiKey
                  ? 'API key set'
                  : data?.xpressbees?.hasPassword && data?.xpressbees?.hasSecretKey
                    ? 'Login configured'
                    : 'Missing token config'}
              </Badge>
            </Flex>

            <Box borderTopWidth="1px" pt={4}>
              <Flex justify="space-between" align="center" gap={3} mb={3}>
                <Text fontWeight="semibold">Manual AWB Range</Text>
                <Badge
                  colorScheme={
                    xpressbeesManualAwb?.active
                      ? 'green'
                      : xpressbeesManualAwb?.configured
                        ? 'orange'
                        : 'gray'
                  }
                >
                  {xpressbeesAwbStatus}
                </Badge>
              </Flex>

              <Flex gap={3} flexWrap="wrap" mb={4}>
                <Box minW="140px" flex="1">
                  <Text fontSize="xs" color="gray.500">
                    Current AWB
                  </Text>
                  <Text fontWeight="semibold" wordBreak="break-all">
                    {xpressbeesAwbRange?.currentAwb || 'Not configured'}
                  </Text>
                </Box>
                <Box minW="140px" flex="1">
                  <Text fontSize="xs" color="gray.500">
                    Range
                  </Text>
                  <Text fontWeight="semibold" wordBreak="break-all">
                    {xpressbeesAwbRange
                      ? `${xpressbeesAwbRange.startAwb} - ${xpressbeesAwbRange.endAwb}`
                      : 'Not configured'}
                  </Text>
                </Box>
                <Box minW="110px">
                  <Text fontSize="xs" color="gray.500">
                    Remaining
                  </Text>
                  <Text fontWeight="semibold">{xpressbeesAwbRange?.remainingCount ?? 0}</Text>
                </Box>
                <Box minW="110px">
                  <Text fontSize="xs" color="gray.500">
                    Used
                  </Text>
                  <Text fontWeight="semibold">{xpressbeesAwbRange?.usedCount ?? 0}</Text>
                </Box>
                <Box minW="110px">
                  <Text fontSize="xs" color="gray.500">
                    Failed
                  </Text>
                  <Text fontWeight="semibold">{xpressbeesAwbRange?.failedCount ?? 0}</Text>
                </Box>
              </Flex>

              <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
                <FormControl>
                  <FormLabel>AWB Starting Number</FormLabel>
                  <Input
                    value={xpressbeesAwbForm.startAwb}
                    onChange={(e) =>
                      setXpressbeesAwbForm((prev) => ({ ...prev, startAwb: e.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="Starting AWB"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>AWB Ending Number</FormLabel>
                  <Input
                    value={xpressbeesAwbForm.endAwb}
                    onChange={(e) =>
                      setXpressbeesAwbForm((prev) => ({ ...prev, endAwb: e.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="Ending AWB"
                  />
                </FormControl>
              </Flex>

              <Button
                colorScheme="blue"
                variant="outline"
                onClick={handleSaveXpressbeesAwbRange}
                isLoading={updateXpressbeesAwbRange.isPending}
                mt={3}
                alignSelf="flex-start"
              >
                Save Manual AWB Range
              </Button>
            </Box>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={xpressbeesForm.apiBase}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, apiBase: e.target.value }))
                }
                placeholder="https://shipment.xpressbees.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Username / Email</FormLabel>
              <Input
                value={xpressbeesForm.username}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Xpressbees username or email"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.password}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Leave blank to keep existing password"
              />
            </FormControl>

            <FormControl>
              <FormLabel>API Key / Token</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.apiKey}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder={data?.xpressbees?.apiKeyMasked || 'Enter Xpressbees API key'}
              />
              {!!data?.xpressbees?.apiKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current key: {data.xpressbees.apiKeyMasked}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Auth Bearer</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.authBearer}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, authBearer: e.target.value }))
                }
                placeholder="Leave blank to keep existing auth bearer"
              />
              {data?.xpressbees?.hasAuthBearer && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Auth bearer already configured on Xpressbees.
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Secret Key</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.secretKey}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, secretKey: e.target.value }))
                }
                placeholder="Leave blank to keep existing secret key"
              />
              {data?.xpressbees?.hasSecretKey && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Secret key already configured on Xpressbees.
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>XB Key</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.xbKey}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, xbKey: e.target.value }))
                }
                placeholder="Leave blank to keep existing XB key"
              />
              {data?.xpressbees?.hasXbKey && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  XB key already configured on Xpressbees.
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>XB Access Key</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.xbAccessKey}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, xbAccessKey: e.target.value }))
                }
                placeholder="Leave blank to keep existing XB access key"
              />
              {data?.xpressbees?.hasXbAccessKey && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  XB access key already configured on Xpressbees.
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Business Account Name</FormLabel>
              <Input
                value={xpressbeesForm.businessAccountName}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    businessAccountName: e.target.value,
                  }))
                }
                placeholder="Required for pre-ship manifest"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Pickup Vendor Code</FormLabel>
              <Input
                value={xpressbeesForm.pickupVendorCode}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, pickupVendorCode: e.target.value }))
                }
                placeholder="Default pickup vendor code"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Business Unit</FormLabel>
              <Input
                value={xpressbeesForm.businessUnit}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, businessUnit: e.target.value }))
                }
                placeholder="ECOM"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Business Flow</FormLabel>
              <Input
                value={xpressbeesForm.businessFlow}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, businessFlow: e.target.value }))
                }
                placeholder="FORWARD"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Business Services</FormLabel>
              <Input
                value={xpressbeesForm.businessServices}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, businessServices: e.target.value }))
                }
                placeholder="SD,SDD,NDD,AIR,SFC,IntraSDD"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Manifest Service Type</FormLabel>
              <Input
                value={xpressbeesForm.manifestServiceType}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    manifestServiceType: e.target.value,
                  }))
                }
                placeholder="SD, SFC, AIR, SDD, NDD"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Manifest Pickup Type</FormLabel>
              <Input
                value={xpressbeesForm.manifestPickupType}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    manifestPickupType: e.target.value,
                  }))
                }
                placeholder="Vendor"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Pincode Business Unit</FormLabel>
              <Input
                value={xpressbeesForm.pincodeBusinessUnit}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    pincodeBusinessUnit: e.target.value,
                  }))
                }
                placeholder="eComm"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Pincode Business Flow</FormLabel>
              <Input
                value={xpressbeesForm.pincodeBusinessFlow}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    pincodeBusinessFlow: e.target.value,
                  }))
                }
                placeholder="Forward"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Pickup Business Service</FormLabel>
              <Input
                value={xpressbeesForm.pickupBusinessService}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    pickupBusinessService: e.target.value,
                  }))
                }
                placeholder="PickUp"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Delivery Business Service</FormLabel>
              <Input
                value={xpressbeesForm.deliveryBusinessService}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    deliveryBusinessService: e.target.value,
                  }))
                }
                placeholder="Delivery"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Serviceability Version</FormLabel>
              <Input
                value={xpressbeesForm.serviceabilityVersion}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({
                    ...prev,
                    serviceabilityVersion: e.target.value,
                  }))
                }
                placeholder="v1"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Tracking Version</FormLabel>
              <Input
                value={xpressbeesForm.trackingVersion}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, trackingVersion: e.target.value }))
                }
                placeholder="v1"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Webhook Secret</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.webhookSecret}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, webhookSecret: e.target.value }))
                }
                placeholder="Leave blank to keep existing webhook secret"
              />
              {data?.xpressbees?.hasWebhookSecret && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Webhook secret already configured on Xpressbees.
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Leave password, token, auth bearer, secret key, XB key, XB access key, or webhook
              secret blank to keep the saved value.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveXpressbees}
              isLoading={updateXpressbees.isPending}
              alignSelf="flex-start"
            >
              Save Xpressbees Credentials
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px" display="none">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Amazon Shipping</Text>
              <Badge colorScheme={data?.amazon?.configured ? 'green' : 'orange'}>
                {data?.amazon?.configured ? 'Configured' : 'Missing credentials'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={amazonForm.apiBase}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, apiBase: e.target.value }))
                }
                placeholder="https://sellingpartnerapi-eu.amazon.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Shipping Business ID</FormLabel>
              <Input
                value={amazonForm.shippingBusinessId}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, shippingBusinessId: e.target.value }))
                }
                placeholder="AmazonShipping_IN"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Region</FormLabel>
              <Input
                value={amazonForm.region}
                onChange={(e) => setAmazonForm((prev) => ({ ...prev, region: e.target.value }))}
                placeholder="eu"
              />
            </FormControl>

            <FormControl>
              <FormLabel>LWA Client ID</FormLabel>
              <Input
                value={amazonForm.lwaClientId}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, lwaClientId: e.target.value }))
                }
                placeholder="Amazon LWA client ID"
              />
            </FormControl>

            <FormControl>
              <FormLabel>LWA Token URL</FormLabel>
              <Input
                value={amazonForm.lwaTokenUrl}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, lwaTokenUrl: e.target.value }))
                }
                placeholder="https://api.amazon.com/auth/o2/token"
              />
            </FormControl>

            <FormControl>
              <FormLabel>LWA Client Secret</FormLabel>
              <Input
                type="password"
                value={amazonForm.lwaClientSecret}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, lwaClientSecret: e.target.value }))
                }
                placeholder="Leave blank to keep existing LWA secret"
              />
              {data?.amazon?.hasLwaClientSecret && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  LWA client secret already configured.
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Refresh Token</FormLabel>
              <Input
                type="password"
                value={amazonForm.refreshToken}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, refreshToken: e.target.value }))
                }
                placeholder={data?.amazon?.refreshTokenMasked || 'Enter Amazon refresh token'}
              />
              {!!data?.amazon?.refreshTokenMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current refresh token: {data.amazon.refreshTokenMasked}
                </Text>
              )}
              <Text fontSize="xs" color="gray.500" mt={1}>
                Amazon refresh tokens usually start with Atzr|. If you only have an Atza| access token, add it below.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Access Token</FormLabel>
              <Input
                type="password"
                value={amazonForm.accessToken}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, accessToken: e.target.value }))
                }
                placeholder={data?.amazon?.accessTokenMasked || 'Optional direct access token'}
              />
              {!!data?.amazon?.accessTokenMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current access token: {data.amazon.accessTokenMasked}
                </Text>
              )}
              <Text fontSize="xs" color="gray.500" mt={1}>
                Atza| access tokens expire quickly; use this only as a temporary fallback.
              </Text>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Use Sandbox</FormLabel>
              <Switch
                isChecked={amazonForm.sandbox}
                onChange={(e) =>
                  setAmazonForm((prev) => ({ ...prev, sandbox: e.target.checked }))
                }
              />
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Use refresh token + LWA credentials for automatic token generation. Leave token and secret fields blank to keep the saved values. If Amazon returns invalid_grant, re-authorize Amazon Shipping and save a new refresh token.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveAmazon}
              isLoading={updateAmazon.isPending}
              alignSelf="flex-start"
            >
              Save Amazon Credentials
            </Button>
          </VStack>
        </Box>
      </Flex>
    </Flex>
  )
}

export default CourierCredentials
