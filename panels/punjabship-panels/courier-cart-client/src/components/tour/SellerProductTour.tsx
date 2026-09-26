import { driver, type Driver, type PopoverDOM } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'
import { useSellerTourProgress, useUpdateSellerTourProgress } from '../../hooks/useSellerTourProgress'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'
import { SELLER_TOUR_START_EVENT } from '../../utils/sellerTour'
import { getImpersonationSession } from '../../utils/impersonationSession'
import { buildSellerTourSteps } from './sellerTourSteps'
import './SellerProductTour.css'

const addButton = (container: HTMLElement, label: string, className: string, onClick: () => void) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `punjabship-tour-button ${className}`.trim()
  button.textContent = label
  button.addEventListener('click', onClick)
  container.appendChild(button)
}

export default function SellerProductTour() {
  const { user } = useAuth()
  const { isReady, isLoading: readinessLoading } = useMerchantReadiness()
  const navigate = useNavigate()
  const location = useLocation()
  const eligible = user.role !== 'admin' && user.role !== 'employee' && !user.employeeId &&
    !isEmbeddedShopifyContext() && !getImpersonationSession()
  const { data: progress, isLoading: progressLoading } = useSellerTourProgress(eligible)
  const { mutate: saveProgress } = useUpdateSellerTourProgress()
  const steps = useMemo(() => buildSellerTourSteps(user.businessType), [user.businessType])
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const driverRef = useRef<Driver | null>(null)
  const autoStarted = useRef(false)

  const removePointer = useCallback(() => {
    document.querySelector('.punjabship-tour-pointer')?.remove()
  }, [])

  const stop = useCallback((status: 'dismiss' | 'finish') => {
    driverRef.current?.destroy()
    driverRef.current = null
    removePointer()
    setActive(false)
    saveProgress({ action: status })
  }, [removePointer, saveProgress])

  const moveTo = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= steps.length) return
    driverRef.current?.destroy()
    driverRef.current = null
    removePointer()
    setStepIndex(nextIndex)
  }, [removePointer, steps.length])

  const renderFooter = useCallback((popover: PopoverDOM, index: number) => {
    popover.footer.style.display = 'block'
    popover.footerButtons.replaceChildren()
    popover.footerButtons.classList.add('punjabship-tour-footer')

    const progressLabel = document.createElement('span')
    progressLabel.className = 'punjabship-tour-progress'
    progressLabel.textContent = `${index + 1} of ${steps.length}`
    popover.footerButtons.appendChild(progressLabel)

    addButton(popover.footerButtons, 'Skip', 'punjabship-tour-button-skip', () => stop('dismiss'))
    if (index > 0) addButton(popover.footerButtons, 'Back', '', () => moveTo(index - 1))
    addButton(
      popover.footerButtons,
      'Next',
      'punjabship-tour-button-primary',
      () => {
        if (index === steps.length - 1) {
          stop('finish')
          return
        }
        saveProgress({ action: 'complete-page', page: steps[index].id })
        moveTo(index + 1)
      },
    )
    window.requestAnimationFrame(() => {
      popover.footerButtons.querySelector<HTMLButtonElement>('.punjabship-tour-button-primary')?.focus()
    })
  }, [moveTo, saveProgress, steps, stop])

  useEffect(() => {
    if (!eligible || readinessLoading || progressLoading || !isReady || active || autoStarted.current) return
    if (progress?.status !== 'pending' && progress?.status !== 'active') return
    autoStarted.current = true
    const firstIncomplete = steps.findIndex((step) => !progress?.completedPages?.includes(step.id))
    setStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0)
    setActive(true)
    saveProgress({ action: 'start' })
  }, [active, eligible, isReady, progress?.completedPages, progress?.status, progressLoading, readinessLoading, saveProgress, steps])

  useEffect(() => {
    const replay = () => {
      if (!eligible || !isReady) return
      autoStarted.current = true
      driverRef.current?.destroy()
      removePointer()
      setStepIndex(0)
      setActive(true)
      saveProgress({ action: 'reset' })
    }
    window.addEventListener(SELLER_TOUR_START_EVENT, replay)
    return () => window.removeEventListener(SELLER_TOUR_START_EVENT, replay)
  }, [eligible, isReady, removePointer, saveProgress])

  useEffect(() => {
    if (!active) return
    const step = steps[stepIndex]
    if (!step) return
    if (step.path && location.pathname !== step.path) {
      navigate(step.path)
      return
    }

    const timer = window.setTimeout(() => {
      driverRef.current?.destroy()
      removePointer()

      const guide = driver({
        animate: true,
        duration: 360,
        overlayColor: '#181426',
        overlayOpacity: 0.72,
        stagePadding: 8,
        stageRadius: 8,
        smoothScroll: true,
        allowClose: false,
        allowScroll: false,
        allowKeyboardControl: false,
        disableActiveInteraction: true,
        popoverClass: 'punjabship-tour-popover',
      })
      driverRef.current = guide

      const selector = step.id === 'navigation' && window.innerWidth < 900
        ? '[data-tour-mobile-menu]'
        : step.selector

      guide.highlight({
        ...(selector ? { element: selector } : {}),
        popover: {
          title: step.title,
          description: step.description,
          ...(selector ? { side: 'bottom' as const } : {}),
          align: 'center',
          showButtons: [],
          onPopoverRender: (popover) => renderFooter(popover, stepIndex),
        },
        onHighlighted: (element) => {
          if (!element) return
          const rect = element.getBoundingClientRect()
          const pointer = document.createElement('span')
          pointer.className = 'punjabship-tour-pointer'
          pointer.style.left = `${Math.max(12, Math.min(window.innerWidth - 38, rect.left + 22))}px`
          pointer.style.top = `${Math.max(12, Math.min(window.innerHeight - 44, rect.top + 18))}px`
          document.body.appendChild(pointer)
        },
      })
    }, step.path ? 650 : 120)

    return () => window.clearTimeout(timer)
  }, [active, location.pathname, navigate, removePointer, renderFooter, stepIndex, steps])

  useEffect(() => () => {
    driverRef.current?.destroy()
    removePointer()
  }, [removePointer])

  return null
}
