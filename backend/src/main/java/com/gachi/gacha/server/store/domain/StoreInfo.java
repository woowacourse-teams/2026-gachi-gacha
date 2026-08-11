package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.store.domain.exception.InvalidStoreException;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@Entity
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreInfo extends BaseTimeEntity {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String businessHours;

    @Builder.Default
    @ElementCollection
    @CollectionTable(
            name = "store_payment_method",
            joinColumns = @JoinColumn(name = "store_id")
    )
    @Column(name = "payment_method")
    private List<String> paymentMethods = new ArrayList<>();

    private String phone;

    @Builder.Default
    @ElementCollection
    @CollectionTable(
            name = "store_facility",
            joinColumns = @JoinColumn(name = "store_id")
    )
    @Column(name = "facility")
    private List<String> facilities = new ArrayList<>();

    private String instagramId;

    private Integer machineAmount;
    private Integer kujiAmount;

    private Long coinPrice;
    private Long gachaMinPrice;
    private Long gachaMaxPrice;
    private Long kujiMinPrice;
    private Long kujiMaxPrice;
    private Long selectGachaMinPrice;
    private Long selectGachaMaxPrice;

    private Boolean hasRandomBox;
    private Boolean hasSelectGacha;

    protected void assignStore(Store store) {
        this.store = store;
    }

    public void modify(StoreInfoUpdate update) {
        validate(update);

        this.name = valueOrCurrent(update.name(), name);
        this.address = valueOrCurrent(update.address(), address);
        this.businessHours = valueOrCurrent(update.businessHours(), businessHours);
        this.phone = valueOrCurrent(update.phone(), phone);
        this.instagramId = valueOrCurrent(update.instagramId(), instagramId);
        this.machineAmount = valueOrCurrent(update.machineAmount(), machineAmount);
        this.kujiAmount = valueOrCurrent(update.kujiAmount(), kujiAmount);
        this.coinPrice = valueOrCurrent(update.coinPrice(), coinPrice);
        this.gachaMinPrice = valueOrCurrent(update.gachaMinPrice(), gachaMinPrice);
        this.gachaMaxPrice = valueOrCurrent(update.gachaMaxPrice(), gachaMaxPrice);
        this.kujiMinPrice = valueOrCurrent(update.kujiMinPrice(), kujiMinPrice);
        this.kujiMaxPrice = valueOrCurrent(update.kujiMaxPrice(), kujiMaxPrice);
        this.selectGachaMinPrice = valueOrCurrent(update.selectGachaMinPrice(), selectGachaMinPrice);
        this.selectGachaMaxPrice = valueOrCurrent(update.selectGachaMaxPrice(), selectGachaMaxPrice);
        this.hasRandomBox = valueOrCurrent(update.hasRandomBox(), hasRandomBox);
        this.hasSelectGacha = valueOrCurrent(update.hasSelectGacha(), hasSelectGacha);
        replaceIfPresent(paymentMethods, update.paymentMethods());
        replaceIfPresent(facilities, update.facilities());
    }

    private void validate(StoreInfoUpdate update) {
        String nextName = valueOrCurrent(update.name(), name);
        String nextAddress = valueOrCurrent(update.address(), address);
        Integer nextMachineAmount = valueOrCurrent(update.machineAmount(), machineAmount);
        Integer nextKujiAmount = valueOrCurrent(update.kujiAmount(), kujiAmount);
        Long nextCoinPrice = valueOrCurrent(update.coinPrice(), coinPrice);
        Long nextGachaMinPrice = valueOrCurrent(update.gachaMinPrice(), gachaMinPrice);
        Long nextGachaMaxPrice = valueOrCurrent(update.gachaMaxPrice(), gachaMaxPrice);
        Long nextKujiMinPrice = valueOrCurrent(update.kujiMinPrice(), kujiMinPrice);
        Long nextKujiMaxPrice = valueOrCurrent(update.kujiMaxPrice(), kujiMaxPrice);
        Long nextSelectMinPrice = valueOrCurrent(update.selectGachaMinPrice(), selectGachaMinPrice);
        Long nextSelectMaxPrice = valueOrCurrent(update.selectGachaMaxPrice(), selectGachaMaxPrice);

        if (nextName == null || nextName.isBlank() || nextAddress == null || nextAddress.isBlank()) {
            throw new InvalidStoreException();
        }
        validateNonNegative(nextMachineAmount, nextKujiAmount, nextCoinPrice);
        validatePriceRange(nextGachaMinPrice, nextGachaMaxPrice);
        validatePriceRange(nextKujiMinPrice, nextKujiMaxPrice);
        validatePriceRange(nextSelectMinPrice, nextSelectMaxPrice);
    }

    private void validateNonNegative(Integer machineAmount, Integer kujiAmount, Long coinPrice) {
        if (isNegative(machineAmount) || isNegative(kujiAmount) || isNegative(coinPrice)) {
            throw new InvalidStoreException();
        }
    }

    private void validatePriceRange(Long minPrice, Long maxPrice) {
        if (isNegative(minPrice) || isNegative(maxPrice)) {
            throw new InvalidStoreException();
        }
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new InvalidStoreException();
        }
    }

    private boolean isNegative(Number value) {
        return value != null && value.longValue() < 0;
    }

    private <T> T valueOrCurrent(T value, T current) {
        return value == null ? current : value;
    }

    private <T> void replaceIfPresent(List<T> current, List<T> values) {
        if (values == null) {
            return;
        }
        current.clear();
        current.addAll(values);
    }
}
